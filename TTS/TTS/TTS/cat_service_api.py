import os
import random
from types import SimpleNamespace

import numpy as np
import pandas as pd
from catsim.estimation import NumericalSearchEstimator
from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import create_engine, text

from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse


ENV_PATH = Path(r"C:\Users\Shi Iu Oi\Desktop\FlyUpProject-1\backend\.env")

load_dotenv(ENV_PATH)

print("ENV_PATH =", ENV_PATH)
print("ENV exists =", ENV_PATH.exists())

raw_db_url = os.getenv("DATABASE_URL")
print("DATABASE_URL loaded =", bool(raw_db_url))

if not raw_db_url:
    raise RuntimeError(f"DATABASE_URL is missing. Checked: {ENV_PATH}")

sqlalchemy_db_url = raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

parsed = urlparse(sqlalchemy_db_url)
query_params = dict(parse_qsl(parsed.query))

# psycopg2 không support param này
query_params.pop("pgbouncer", None)

# Supabase thường cần SSL
query_params.setdefault("sslmode", "require")

clean_query = urlencode(query_params)
DB_CONN = urlunparse(parsed._replace(query=clean_query))

print("SQLAlchemy DB_CONN =", DB_CONN)

engine = create_engine(DB_CONN, pool_pre_ping=True)

app = Flask(__name__)
CORS(app)


def irt_prob(a, b, c, theta):
    return c + (1 - c) / (1 + np.exp(-1.7 * a * (theta - b)))


def item_information(item, theta):
    a, b, c, _ = item
    p = irt_prob(a, b, c, theta)
    q = 1 - p

    if p <= 0 or q <= 0 or (1 - c) == 0:
        return 0.0

    return (1.7 * a) ** 2 * ((p - c) ** 2 / ((1 - c) ** 2 * p * q)) * p * q


def estimate_theta(items, administered_items, responses, current_theta):
    theta_before = current_theta

    try:
        if not administered_items or len(administered_items) <= 1:
            delta = 0.3 if responses and responses[-1] == 1 else -0.3
            return float(np.clip(current_theta + delta, -4, 4)), theta_before

        est = NumericalSearchEstimator()
        dummy = SimpleNamespace(
            items=np.array(items, dtype=float),
            administered_items=np.array(administered_items, dtype=int),
            response_vectors=[np.array(responses, dtype=int)],
            est_theta=current_theta
        )

        new_theta = est.estimate(
            simulator=dummy,
            items=np.array(items, dtype=float),
            administered_items=np.array(administered_items, dtype=int),
            response_vector=np.array(responses, dtype=int),
            est_theta=current_theta
        )

        return float(np.clip(new_theta, -4, 4)), theta_before

    except Exception as e:
        delta = 0.2 if responses and responses[-1] == 1 else -0.2
        print("estimate_theta fallback:", e)
        return float(np.clip(current_theta + delta, -4, 4)), theta_before


def load_assignment_items(assignment_id):
    df = pd.read_sql(
        text("""
            SELECT "Id", "Content", "ParamA", "ParamB", "ParamC"
            FROM "McqQuestions"
            WHERE "AssignmentId" = :aid
              AND "ParamA" IS NOT NULL
              AND "ParamB" IS NOT NULL
              AND "ParamC" IS NOT NULL
        """),
        engine,
        params={"aid": assignment_id}
    )

    if df.empty:
        return None

    df["Id"] = df["Id"].astype(str)
    df["ParamD"] = 1.0
    return df


def load_question_choices(question_id):
    choices_df = pd.read_sql(
        text("""
            SELECT "Id", "Content"
            FROM "McqChoices"
            WHERE "McqQuestionId" = :qid
        """),
        engine,
        params={"qid": question_id}
    )

    records = choices_df.to_dict(orient="records")
    for row in records:
        if "Id" in row and row["Id"] is not None:
            row["Id"] = str(row["Id"])
    return records


def normalize_history(answered_questions, responses, all_ids):
    if len(answered_questions) != len(responses):
        raise ValueError("answered_questions and response history must match length.")

    normalized_qids = []
    normalized_responses = []

    for qid, resp in zip(answered_questions, responses):
        qid_str = str(qid)
        if qid_str in all_ids:
            normalized_qids.append(qid_str)
            normalized_responses.append(int(resp))

    return normalized_qids, normalized_responses


@app.route("/api/cat/next-question", methods=["POST", "OPTIONS"])
def next_question():
    try:
        if request.method == "OPTIONS":
            return jsonify({}), 200

        data = request.get_json(silent=True) or {}

        assignment_id = data.get("assignment_id")
        answered_questions = data.get("answered_questions", []) or []
        last_response = data.get("last_response", []) or []
        client_theta = data.get("current_theta", 0)

        if not assignment_id:
            return jsonify({"error": "assignment_id is required."}), 400

        try:
            current_theta = float(client_theta) if client_theta is not None else 0.0
        except Exception:
            current_theta = 0.0

        df = load_assignment_items(assignment_id)
        if df is None:
            return jsonify({"error": "No valid questions found."}), 400

        all_ids = df["Id"].tolist()
        items = df[["ParamA", "ParamB", "ParamC", "ParamD"]].to_numpy(dtype=float)

        if answered_questions or last_response:
            try:
                matched_qids, matched_responses = normalize_history(
                    answered_questions,
                    last_response,
                    all_ids
                )
            except ValueError as ve:
                return jsonify({"error": str(ve)}), 400

            if matched_qids:
                administered_items = [all_ids.index(qid) for qid in matched_qids]

                if len(administered_items) != len(matched_responses):
                    return jsonify({"error": "administered_items and responses length mismatch."}), 400

                theta_after, _ = estimate_theta(
                    items,
                    administered_items,
                    matched_responses,
                    current_theta
                )
                current_theta = theta_after

        unanswered_df = df[~df["Id"].isin([str(q) for q in answered_questions])].reset_index(drop=True)

        if unanswered_df.empty:
            return jsonify({
                "message": "All questions completed.",
                "final_theta": round(current_theta, 3)
            })

        unanswered_items = unanswered_df[["ParamA", "ParamB", "ParamC", "ParamD"]].to_numpy(dtype=float)
        info_values = [item_information(item, current_theta) for item in unanswered_items]

        sorted_indices = np.argsort(info_values)[::-1]
        top_k = sorted_indices[:3] if len(sorted_indices) >= 3 else sorted_indices
        next_idx_local = int(random.choice(top_k))
        next_question_row = unanswered_df.iloc[next_idx_local]

        qid = str(next_question_row["Id"])
        choices = load_question_choices(qid)

        return jsonify({
            "next_question": {
                "question_id": qid,
                "content": next_question_row["Content"],
                "choices": choices
            },
            "temp_theta": round(current_theta, 3)
        })

    except Exception as e:
        print("ERROR /next-question:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/cat/submit", methods=["POST"])
def submit_assignment():
    try:
        data = request.get_json(silent=True) or {}

        assignment_id = data.get("assignment_id")
        answered_questions = data.get("answered_questions", []) or []
        responses = data.get("responses", []) or []
        alpha = float(data.get("smoothing_alpha", 0.2))
        initial_theta = data.get("initial_theta", 0)

        if not assignment_id:
            return jsonify({"error": "assignment_id is required."}), 400

        if not answered_questions or not responses:
            return jsonify({"error": "answered_questions and responses are required."}), 400

        if len(answered_questions) != len(responses):
            return jsonify({"error": "answered_questions and responses must match length."}), 400

        try:
            user_theta_before = float(initial_theta) if initial_theta is not None else 0.0
        except Exception:
            user_theta_before = 0.0

        df = load_assignment_items(assignment_id)
        if df is None:
            return jsonify({"error": "No valid questions."}), 400

        all_ids = df["Id"].tolist()
        items = df[["ParamA", "ParamB", "ParamC", "ParamD"]].to_numpy(dtype=float)

        matched_qids, matched_responses = normalize_history(
            answered_questions,
            responses,
            all_ids
        )

        if not matched_qids:
            return jsonify({"error": "No valid administered questions in submission."}), 400

        administered_items = [all_ids.index(qid) for qid in matched_qids]
        resp_list = [int(r) for r in matched_responses]

        if len(administered_items) != len(resp_list):
            return jsonify({"error": "administered_items and responses length mismatch."}), 400

        final_theta, _ = estimate_theta(items, administered_items, resp_list, user_theta_before)

        correct_count = int(sum(resp_list))
        total_questions = int(len(resp_list))
        new_theta = user_theta_before * (1 - alpha) + final_theta * alpha

        return jsonify({
            "message": "Assignment completed successfully.",
            "final_theta": round(final_theta, 3),
            "updated_user_theta": round(new_theta, 3),
            "correct": correct_count,
            "total": total_questions
        })

    except Exception as e:
        print("ERROR /submit:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("CAT compute service running on http://127.0.0.1:5001")
    app.run(host="0.0.0.0", port=5001, debug=True)
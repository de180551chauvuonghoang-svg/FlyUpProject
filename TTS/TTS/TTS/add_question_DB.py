import json
import uuid

import pyodbc

# ======= Kết nối SQL Server =======
conn_str = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost;"                # hoặc localhost\\SQLEXPRESS
    "DATABASE=CourseHubDB;"
    "UID=sa;"
    "PWD=123456;"
    "TrustServerCertificate=yes;"
)
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

# ======= Đọc file JSON =======
with open("Java_Course_150_questions.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# ======= Gắn vào assignment hiện có =======
assignment_id = "CA5BF6EE-5DF4-40F0-ABEF-2DE57CA6BCCB"

# Nếu cần xác định SectionId, chạy truy vấn dưới đây trong SSMS:
# SELECT SectionId FROM dbo.Assignments WHERE Id = '6965B04A-E57A-4CC0-AC98-C19C61EAA497'z
# và đặt SectionId đó vào biến này nếu cần sau này

# ======= Import câu hỏi =======
for q in data:
    qid = uuid.uuid4()
    question_text = q["question"]
    difficulty = q.get("difficulty", "Unknown")
    a, b, c = q.get("param_a", 1.0), q.get("param_b", 0.0), q.get("param_c", 0.2)

    cursor.execute("""
        INSERT INTO dbo.McqQuestions (Id, Content, AssignmentId, ParamA, ParamB, ParamC, Difficulty)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, qid, question_text, assignment_id, a, b, c, difficulty)

    for opt in q["options"]:
        cid = uuid.uuid4()
        is_correct = 1 if opt.strip() == q["answer"].strip() else 0
        cursor.execute("""
            INSERT INTO dbo.McqChoices (Id, Content, IsCorrect, McqQuestionId)
            VALUES (?, ?, ?, ?)
        """, cid, opt, is_correct, qid)

conn.commit()
conn.close()
print("✅ Import hoàn tất 150 câu hỏi Java vào DB.")

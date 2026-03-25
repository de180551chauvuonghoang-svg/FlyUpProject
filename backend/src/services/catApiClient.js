const CAT_BASE = process.env.CAT_BASE_URL || "http://127.0.0.1:5001/api/cat";

export async function requestCatNextQuestion(payload) {
    const response = await fetch(`${CAT_BASE}/next-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.error || "CAT next-question failed");
    }

    return data;
}

export async function requestCatSubmit(payload) {
    const response = await fetch(`${CAT_BASE}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.error || "CAT submit failed");
    }

    return data;
}
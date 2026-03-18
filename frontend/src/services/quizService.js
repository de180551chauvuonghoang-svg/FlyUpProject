import { apiCall, API_BASE_URL as API_BASE } from "../config/apiConfig";

/**
 * Fetch all assignments for a course
 */
export const fetchAssignmentsByCourse = async (courseId) => {
    const data = await apiCall(`/quiz/course/${courseId}/assignments`);
    return data.data || [];
};

/**
 * Fetch submission history for a user + assignment
 */
export const fetchSubmissionHistory = async (assignmentId, userId) => {
    const data = await apiCall(
        `/quiz/assignment/${assignmentId}/submissions?userId=${userId}`
    );
    return data.data || [];
};

export const startCatQuiz = async (payload, token) => {
    const response = await fetch(`${API_BASE}/quiz/cat/start`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    console.log("[startCatQuiz] status =", response.status);
    console.log("[startCatQuiz] raw response =", rawText);

    let data = {};
    try {
        data = rawText ? JSON.parse(rawText) : {};
    } catch {
        throw new Error(`startCatQuiz returned non-JSON response. Status=${response.status}. Body=${rawText}`);
    }

    if (!response.ok) {
        throw new Error(data?.error || "Failed to start CAT quiz");
    }

    return data;
};

export const answerCatQuestion = async (payload, token) => {
    const response = await fetch(`${API_BASE}/quiz/cat/answer`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    console.log("[answerCatQuestion] status =", response.status);
    console.log("[answerCatQuestion] raw response =", rawText);

    let data = {};
    try {
        data = rawText ? JSON.parse(rawText) : {};
    } catch {
        throw new Error(`answerCatQuestion returned non-JSON response. Status=${response.status}. Body=${rawText}`);
    }

    if (!response.ok) {
        throw new Error(data?.error || "Failed to answer CAT question");
    }

    return data;
};

export const finishCatQuiz = async (payload, token) => {
    const response = await fetch(`${API_BASE}/quiz/cat/finish`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    console.log("[finishCatQuiz] status =", response.status);
    console.log("[finishCatQuiz] raw response =", rawText);

    let data = {};
    try {
        data = rawText ? JSON.parse(rawText) : {};
    } catch {
        throw new Error(`finishCatQuiz returned non-JSON response. Status=${response.status}. Body=${rawText}`);
    }

    if (!response.ok) {
        throw new Error(data?.error || "Failed to finish CAT quiz");
    }

    return data;
};

/**
 * Call AI to explain why the selected answer is correct or incorrect
 */
export const getAIExplanation = async (payload, token) => {
    const response = await fetch(`${API_BASE}/quiz/cat/explain`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error || "Failed to get AI explanation");
    }
    return data;
};
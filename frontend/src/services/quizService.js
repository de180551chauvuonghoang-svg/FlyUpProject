import { apiCall } from "../config/apiConfig";

const API_BASE = "http://localhost:5000";

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
    const response = await fetch(`${API_BASE}/api/quiz/cat/start`, {
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
    const response = await fetch(`${API_BASE}/api/quiz/cat/answer`, {
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
    const response = await fetch(`${API_BASE}/api/quiz/cat/finish`, {
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
 * Generate instant AI practice quiz from lesson content
 */
export const generateInstantAIQuiz = async (payload, token) => {
    const response = await fetch(`${API_BASE}/api/ai/quiz/generate-instant`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error || "Failed to generate AI quiz");
    }
    return data;
};

/**
 * Fetch a single AI quiz by ID
 */
export const fetchAiQuiz = async (aiQuizId, token) => {
    const response = await fetch(`${API_BASE}/api/ai/quiz/${aiQuizId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch AI quiz");
    }
    return data;
};

/**
 * Fetch AI quizzes for a specific lesson/course
 */
export const fetchAiQuizzesByLesson = async (courseId, lessonId, token) => {
    const response = await fetch(`${API_BASE}/api/ai/quiz/lesson/${courseId}/${lessonId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch AI quizzes for lesson");
    }
    return data;
};


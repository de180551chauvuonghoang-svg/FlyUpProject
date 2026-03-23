const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getAccessToken() {
    return localStorage.getItem("accessToken");
}

async function request(path, options = {}) {
    const token = getAccessToken();

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });

    const raw = await response.text();
    let data = {};
    try {
        data = raw ? JSON.parse(raw) : {};
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(data?.error || "Request failed");
    }

    return data;
}

export async function fetchInstructorCoursesForBank() {
    const data = await request("/question-banks/meta/courses");
    return data.data || [];
}

export async function fetchSectionsByCourse(courseId) {
    const data = await request(`/quiz/course/${courseId}/sections`);
    return data.data || [];
}

export async function fetchPublishedQuestionBanksByCourse(courseId) {
    const data = await request(`/question-banks/published/by-course?courseId=${courseId}`);
    return data.data || [];
}

export async function createAssignmentFromBank(payload) {
    const data = await request("/quiz/assignments/from-bank", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return data.data;
}

export async function fetchAssignmentsByQuestionBank(questionBankId) {
    const data = await request(`/quiz/question-bank/${questionBankId}/assignments`);
    return data.data || [];
}

export async function fetchAssignmentSnapshotDetail(assignmentId) {
    const data = await request(`/quiz/assignments/${assignmentId}/preview`);
    return data.data;
}

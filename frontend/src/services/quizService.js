import { apiCall } from "../config/apiConfig";

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

export const startCatQuiz = async (payload) => {
    return await apiCall("/quiz/cat/start", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const answerCatQuestion = async (payload) => {
    return await apiCall("/quiz/cat/answer", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const finishCatQuiz = async (payload) => {
    return await apiCall("/quiz/cat/finish", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

/**
 * Generate instant AI practice quiz from lesson content
 */
export const generateInstantAIQuiz = async (payload) => {
    return await apiCall("/ai/quiz/generate-instant", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};


/**
 * Fetch a single AI quiz by ID
 */
export const fetchAiQuiz = async (aiQuizId, token) => {
    return await apiCall(`/ai/quiz/${aiQuizId}`, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
};

/**
 * Fetch AI quizzes for a specific lesson/course
 */
export const fetchAiQuizzesByLesson = async (courseId, lessonId, token) => {
    return await apiCall(`/ai/quiz/lesson/${courseId}/${lessonId}`, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
};


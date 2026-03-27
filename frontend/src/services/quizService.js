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

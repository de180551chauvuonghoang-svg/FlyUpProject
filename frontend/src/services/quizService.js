import { apiCall } from "../config/apiConfig";

const CAT_BASE = "http://127.0.0.1:5001/api/cat";

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

/**
 * CAT: Get next question
 * @param {object} payload - { user_id, course_id, assignment_id, answered_questions, last_response, current_theta }
 */
export const catNextQuestion = async (payload) => {
    const response = await fetch(`${CAT_BASE}/next-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error(`CAT Error: ${response.statusText}`);
    }
    return response.json();
};

/**
 * CAT: Submit quiz and finalize results
 * @param {object} payload - { user_id, course_id, assignment_id, answered_questions, responses, smoothing_alpha }
 */
export const catSubmit = async (payload) => {
    const response = await fetch(`${CAT_BASE}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error(`CAT Submit Error: ${response.statusText}`);
    }
    return response.json();
};

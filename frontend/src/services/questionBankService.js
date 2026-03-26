const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getAccessToken() {
    return localStorage.getItem('accessToken');
}

async function request(path, options = {}) {
    const token = getAccessToken();

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.error || 'Request failed');
    }

    return data;
}

export async function fetchQuestionBanks(params = {}) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value) !== "") {
            searchParams.set(key, String(value));
        }
    });

    const query = searchParams.toString();
    const data = await request(`/question-banks${query ? `?${query}` : ""}`);

    return {
        items: data.data || [],
        meta: data.meta || {
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0,
        },
    };
}
export async function fetchQuestionBankCourses() {
    const data = await request('/question-banks/meta/courses');
    return data.data || [];
}

export async function createQuestionBank(payload) {
    const data = await request('/question-banks', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return data.data;
}

export async function fetchQuestionBankDetail(bankId) {
    const data = await request(`/question-banks/${bankId}`);
    return data.data;
}

export async function fetchQuestionBankQuestions(bankId) {
    const data = await request(`/question-banks/${bankId}/questions`);
    return data.data || [];
}

export async function createQuestionBankQuestion(bankId, payload) {
    const data = await request(`/question-banks/${bankId}/questions`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return data.data;
}

export async function updateQuestionBankQuestion(bankId, questionId, payload) {
    const data = await request(`/question-banks/${bankId}/questions/${questionId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    return data.data;
}

export async function deleteQuestionBankQuestion(bankId, questionId) {
    const data = await request(`/question-banks/${bankId}/questions/${questionId}`, {
        method: 'DELETE',
    });
    return data.data;
}

export async function publishQuestionBank(bankId) {
    const data = await request(`/question-banks/${bankId}/publish`, {
        method: 'POST',
    });
    return data.data;
}

export async function unpublishQuestionBank(bankId) {
    const data = await request(`/question-banks/${bankId}/unpublish`, {
        method: 'POST',
    });
    return data.data;
}

export async function updateQuestionBank(bankId, payload) {
    const data = await request(`/question-banks/${bankId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    return data.data;
}

export async function archiveQuestionBank(bankId) {
    const data = await request(`/question-banks/${bankId}/archive`, {
        method: 'POST',
    });
    return data.data;
}

export const restoreQuestionBank = async (bankId) => {
    const data = await request(`/question-banks/${bankId}/restore`, {
        method: 'POST',
    });
    return data.data;
};

/**
 * AI Generation
 */
export async function bulkGenerateAIQuestions(bankId, courseId, count = 5, difficulty = 'Mixed') {
    const data = await request(`/ai/question-bank/generate`, {
        method: 'POST',
        body: JSON.stringify({
            questionBankId: bankId,
            courseId,
            count,
            difficulty,
        }),
    });
    return data; // bulkGenerateToBank returns success object directly
}


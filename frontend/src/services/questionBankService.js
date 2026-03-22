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

export async function fetchQuestionBanks({ tab = 'mine', search = '', courseId = '' } = {}) {
    const params = new URLSearchParams();

    if (tab) params.set('tab', tab);
    if (search) params.set('search', search);
    if (courseId) params.set('courseId', courseId);

    const data = await request(`/question-banks?${params.toString()}`);
    return data.data || [];
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
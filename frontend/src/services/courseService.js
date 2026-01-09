const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchCourses = async (params) => {
    const queryParams = new URLSearchParams(params);
    const res = await fetch(`${API_URL}/courses?${queryParams.toString()}`);
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
};

export const fetchCourseById = async (id) => {
    const res = await fetch(`${API_URL}/courses/${id}`);
    if (!res.ok) {
        if (res.status === 404) throw new Error('Course not found');
        throw new Error('Failed to fetch course');
    }
    const json = await res.json();
    if (json.success && json.data) return json.data;
    throw new Error('Invalid course data');
};

export const fetchCourseReviews = async (courseId, page = 1, limit = 5) => {
    const res = await fetch(`${API_URL}/courses/${courseId}/reviews?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    const json = await res.json();
    return json;
};

export const createCourseReview = async (courseId, data, token) => {
    const res = await fetch(`${API_URL}/courses/${courseId}/reviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit review');
    }
    
    return res.json();
};

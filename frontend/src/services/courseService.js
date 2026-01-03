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

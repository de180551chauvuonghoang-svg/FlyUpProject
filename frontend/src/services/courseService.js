const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchCourses = async (params) => {
    const queryParams = new URLSearchParams(params);
    const res = await fetch(`${API_URL}/courses?${queryParams.toString()}`);
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchUserEnrollments = async (userId, page = 1, limit = 10) => {
    const token = localStorage.getItem('accessToken');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/users/${userId}/enrollments?page=${page}&limit=${limit}`, {
        headers
    });
    
    if (!res.ok) {
        throw new Error('Failed to fetch enrollments');
    }
    return res.json();
};

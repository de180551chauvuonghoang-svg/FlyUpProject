import { API_BASE_URL as API_URL } from "../config/apiConfig";

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

export const updateUserProfile = async (userId, data) => {
    const token = localStorage.getItem('accessToken');
    const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
    };

    const res = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        throw new Error('Failed to update profile');
    }
    return res.json();
};

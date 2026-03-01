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

/**
 * Check if a user is enrolled in a specific course without pagination issues.
 * Returns { isEnrolled: boolean }
 */
export const fetchUserEnrollmentForCourse = async (userId, courseId) => {
    const token = localStorage.getItem('accessToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    // Fetch all enrollments with a high limit to avoid pagination cutoff,
    // using courseId filter if the backend supports it, or a large limit.
    const res = await fetch(
        `${API_URL}/users/${userId}/enrollments?page=1&limit=1000`,
        { headers }
    );

    if (!res.ok) throw new Error('Failed to fetch enrollments');
    const data = await res.json();
    const enrolled = data?.enrollments?.some(e => e.CourseId === courseId) ?? false;
    return { isEnrolled: enrolled };
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

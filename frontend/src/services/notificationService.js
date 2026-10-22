import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Get user notifications
 */
export const fetchNotifications = async (page = 1, limit = 20) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/notifications`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Get unread notifications count
 */
export const fetchUnreadCount = async () => {
    const token = localStorage.getItem('token');
    if (!token) return { count: 0 };
    
    try {
        const response = await axios.get(`${API_URL}/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching unread count", error);
        return { count: 0 };
    }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (id) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

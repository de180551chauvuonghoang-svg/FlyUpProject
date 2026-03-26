import { fetchWithAuth, API_BASE_URL } from './api';

const notificationService = {
    /**
     * Get admin notifications
     * @param {Object} params - page, limit, status
     * @returns {Promise<Object>}
     */
    getNotifications: async (params = {}) => {
        const { page = 1, limit = 10, status = 'Pending' } = params;
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            status
        });

        return fetchWithAuth(`${API_BASE_URL}/admin/notifications?${queryParams}`, {
            method: 'GET'
        });
    },

    /**
     * Mark notification as read
     * @param {string} id - Notification ID
     * @returns {Promise<Object>}
     */
    markAsRead: async (id) => {
        return fetchWithAuth(`${API_BASE_URL}/admin/notifications/${id}/read`, {
            method: 'PUT'
        });
    }
};

export default notificationService;

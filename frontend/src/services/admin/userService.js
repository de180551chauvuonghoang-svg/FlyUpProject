/**
 * User Service
 * Handles all user management API calls
 * Uses shared fetchWithAuth for automatic token refresh
 */

import { API_BASE_URL, fetchWithAuth } from './api';

/**
 * User Service Object
 */
const userService = {
  /**
   * Get users list with pagination and search
   * @param {Object} params - Query parameters
   * @param {number} params.page - Current page (1-indexed)
   * @param {number} params.limit - Items per page
   * @param {string} params.search - Search query
   * @param {string} params.status - Filter by status ('ALL' | 'ACTIVE' | 'LOCKED')
   * @returns {Promise<Object>}
   */
  getUsers: async ({ page = 1, limit = 10, search = '', status = 'ALL', role = '' } = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status
    });

    if (role) {
      params.append('role', role);
    }

    return fetchWithAuth(`${API_BASE_URL}/admin/users?${params}`, {
      method: 'GET',
    });
  },

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  getUserById: async (userId) => {
    return fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'GET',
    });
  },

  /**
   * Lock a user account
   * @param {string} userId - User ID to lock
   * @param {string} reason - Optional reason for locking
   * @returns {Promise<Object>}
   */
  lockUser: async (userId, reason = '') => {
    return fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/lock`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Unlock a user account
   * @param {string} userId - User ID to unlock
   * @returns {Promise<Object>}
   */
  unlockUser: async (userId) => {
    return fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/unlock`, {
      method: 'PUT',
    });
  },

  /**
   * Search users (debounced on frontend)
   * @param {string} query - Search query
   * @returns {Promise<Array>}
   */
  searchUsers: async (query) => {
    if (!query) return [];

    const params = new URLSearchParams({
      page: '1',
      limit: '5',
      search: query
    });

    const data = await fetchWithAuth(`${API_BASE_URL}/admin/users?${params}`, {
      method: 'GET',
    });
    return data.users || [];
  },

  /**
   * Get admin dashboard stats
   * @returns {Promise<Object>}
   */
  getStats: async () => {
    return fetchWithAuth(`${API_BASE_URL}/admin/stats`, {
      method: 'GET',
    });
  },

  /**
   * Get user transaction history
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Current page (1-indexed)
   * @param {number} params.limit - Items per page
   * @returns {Promise<Object>}
   */
  getUserTransactions: async (userId, { page = 1, limit = 5 } = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/transactions?${params}`, {
      method: 'GET',
    });
  },
  /**
   * Get courses a user is enrolled in (for Learners)
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  getUserEnrollments: async (userId) => {
    return fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/enrollments`, {
      method: 'GET',
    });
  },

  /**
   * Get courses created by an instructor
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  getUserCourses: async (userId) => {
    return fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/courses`, {
      method: 'GET',
    });
  },
};

export default userService;

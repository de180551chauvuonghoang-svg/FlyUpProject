/**
 * User Service
 * Handles all user management API calls
 * Now using real API endpoints
 */

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Get auth token from localStorage
 * @returns {string|null}
 */
const getAuthToken = () => {
  return localStorage.getItem('adminAccessToken');
};

/**
 * Create headers with authentication
 * @returns {Object}
 */
const createAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Handle API response
 * @param {Response} response
 * @returns {Promise}
 */
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
  }
  return data;
};

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
  getUsers: async ({ page = 1, limit = 10, search = '', status = 'ALL' } = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status
    });

    const response = await fetch(`${API_URL}/admin/users?${params}`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });

    return handleResponse(response);
  },

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  getUserById: async (userId) => {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });

    return handleResponse(response);
  },

  /**
   * Lock a user account
   * @param {string} userId - User ID to lock
   * @param {string} reason - Optional reason for locking
   * @returns {Promise<Object>}
   */
  lockUser: async (userId, reason = '') => {
    const response = await fetch(`${API_URL}/admin/users/${userId}/lock`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify({ reason }),
    });

    return handleResponse(response);
  },

  /**
   * Unlock a user account
   * @param {string} userId - User ID to unlock
   * @returns {Promise<Object>}
   */
  unlockUser: async (userId) => {
    const response = await fetch(`${API_URL}/admin/users/${userId}/unlock`, {
      method: 'PUT',
      headers: createAuthHeaders(),
    });

    return handleResponse(response);
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

    const response = await fetch(`${API_URL}/admin/users?${params}`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });

    const data = await handleResponse(response);
    return data.users || [];
  },

  /**
   * Get admin dashboard stats
   * @returns {Promise<Object>}
   */
  getStats: async () => {
    const response = await fetch(`${API_URL}/admin/stats`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });

    return handleResponse(response);
  },
};

export default userService;

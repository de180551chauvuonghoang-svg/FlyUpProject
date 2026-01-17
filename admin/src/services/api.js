/**
 * API Configuration
 * Base configuration for all API calls
 * Ready for real API integration
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/**
 * Default headers for API requests
 */
const defaultHeaders = {
    'Content-Type': 'application/json',
};

/**
 * Get auth token from localStorage
 * @returns {string|null}
 */
const getAuthToken = () => {
    return localStorage.getItem('adminToken');
};

/**
 * Create headers with authentication
 * @returns {Object}
 */
const createAuthHeaders = () => {
    const token = getAuthToken();
    return {
        ...defaultHeaders,
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

/**
 * Handle API response
 * @param {Response} response
 * @returns {Promise}
 */
const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

/**
 * API client with common methods
 */
const api = {
    /**
     * GET request
     * @param {string} endpoint
     * @returns {Promise}
     */
    get: async (endpoint) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: createAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * POST request
     * @param {string} endpoint
     * @param {Object} data
     * @returns {Promise}
     */
    post: async (endpoint, data) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: createAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    /**
     * PUT request
     * @param {string} endpoint
     * @param {Object} data
     * @returns {Promise}
     */
    put: async (endpoint, data) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: createAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    /**
     * DELETE request
     * @param {string} endpoint
     * @returns {Promise}
     */
    delete: async (endpoint) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: createAuthHeaders(),
        });
        return handleResponse(response);
    },
};

export default api;
export { API_BASE_URL, getAuthToken, createAuthHeaders };

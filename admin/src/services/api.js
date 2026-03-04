/**
 * API Configuration
 * Base configuration for all API calls
 * Includes automatic token refresh on 401 responses
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    return localStorage.getItem('adminAccessToken');
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
 * Try to refresh the access token using the stored refresh token.
 * Returns the new access token on success, or null on failure.
 */
let refreshPromise = null; // prevent concurrent refresh calls

const tryRefreshToken = async () => {
    // If a refresh is already in progress, wait for it
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const refreshToken = localStorage.getItem('adminRefreshToken');
            if (!refreshToken) return null;

            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) return null;

            const data = await response.json();

            // Store new tokens
            localStorage.setItem('adminAccessToken', data.session.accessToken);
            localStorage.setItem('adminRefreshToken', data.session.refreshToken);

            if (data.user) {
                localStorage.setItem('adminUser', JSON.stringify(data.user));
            }

            return data.session.accessToken;
        } catch {
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};

/**
 * Handle API response
 * @param {Response} response
 * @returns {Promise}
 */
const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

/**
 * Fetch with automatic token refresh on 401.
 * If the initial request returns 401, it tries to refresh the token
 * and retries the request once.
 * @param {string} url - Full URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise}
 */
const fetchWithAuth = async (url, options = {}) => {
    // First attempt
    const response = await fetch(url, {
        ...options,
        headers: { ...createAuthHeaders(), ...options.headers },
    });

    if (response.status === 401) {
        // Try to refresh the token
        const newToken = await tryRefreshToken();
        if (newToken) {
            // Retry the request with the new token
            const retryResponse = await fetch(url, {
                ...options,
                headers: {
                    ...createAuthHeaders(), // will pick up the new token
                    ...options.headers,
                    Authorization: `Bearer ${newToken}`,
                },
            });
            return handleResponse(retryResponse);
        }

        // Refresh failed — redirect to login
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
    }

    return handleResponse(response);
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
        return fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
        });
    },

    /**
     * POST request
     * @param {string} endpoint
     * @param {Object} data
     * @returns {Promise}
     */
    post: async (endpoint, data) => {
        return fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * PUT request
     * @param {string} endpoint
     * @param {Object} data
     * @returns {Promise}
     */
    put: async (endpoint, data) => {
        return fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    /**
     * DELETE request
     * @param {string} endpoint
     * @returns {Promise}
     */
    delete: async (endpoint) => {
        return fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
        });
    },
};

export default api;
export { API_BASE_URL, getAuthToken, createAuthHeaders, fetchWithAuth };

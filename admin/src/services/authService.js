/**
 * Auth Service
 * Handles authentication API calls
 * Now using real API endpoints
 */

// API URL - use same as backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Auth Service Object
 */
const authService = {
  /**
   * Login with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>}
   */
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Login failed');
    }

    // Check if user is admin
    if (data.user.role !== 'Admin') {
      throw new Error('Access denied. Admin privileges required.');
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName,
        role: data.user.role,
        avatar: data.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.fullName)}&background=8b5cf6&color=fff`,
      },
      session: {
        accessToken: data.session.accessToken,
        refreshToken: data.session.refreshToken,
      },
    };
  },

  /**
   * Login with Google credential
   * @param {string} credential - Google ID token
   * @returns {Promise<Object>}
   */
  googleLogin: async (credential) => {
    const response = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || data.error || 'Google login failed');
    }

    // Check if user is admin
    if (data.user.role !== 'Admin') {
      throw new Error('Access denied. Admin privileges required.');
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName,
        role: data.user.role,
        avatar: data.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.fullName)}&background=8b5cf6&color=fff`,
      },
      session: {
        accessToken: data.session.accessToken,
        refreshToken: data.session.refreshToken,
      },
    };
  },

  /**
   * Logout current user
   * @param {string} refreshToken
   * @returns {Promise<boolean>}
   */
  logout: async (refreshToken) => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    return true;
  },

  /**
   * Get current user info
   * @param {string} accessToken
   * @returns {Promise<Object>}
   */
  getCurrentUser: async (accessToken) => {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user');
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName,
        role: data.user.role,
        avatar: data.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.fullName)}&background=8b5cf6&color=fff`,
      },
    };
  },

  /**
   * Refresh access token
   * @param {string} refreshToken
   * @returns {Promise<Object>}
   */
  refreshToken: async (refreshToken) => {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Token refresh failed');
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName,
        role: data.user.role,
        avatar: data.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.fullName)}&background=8b5cf6&color=fff`,
      },
      session: {
        accessToken: data.session.accessToken,
        refreshToken: data.session.refreshToken,
      },
    };
  },
};

export default authService;

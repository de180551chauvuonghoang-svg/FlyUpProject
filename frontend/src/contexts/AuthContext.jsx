import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextDef.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(!!accessToken);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          // Only clear if 401 Unauthorized, otherwise might be temporary network error
          if (response.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setAccessToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const signUp = async (email, password, fullName) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName })
      });
      const data = await response.json();
      if (!response.ok) return { data: null, error: { message: data.error || data.message } };
      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  };

  const signIn = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) return { data: null, error: { message: data.error || data.message } };
      
      if (data.session) {
        localStorage.setItem('accessToken', data.session.accessToken);
        localStorage.setItem('refreshToken', data.session.refreshToken);
        setAccessToken(data.session.accessToken);
      }
      setUser(data.user);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  };

  const signInWithGoogle = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const signInWithFacebook = () => {
    window.location.href = `${API_URL}/auth/facebook`;
  };

  const signOut = async () => {
    // Get refresh token before clearing
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Clear tokens and user state IMMEDIATELY (no waiting)
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setUser(null);
    
    // Call logout API in background (fire-and-forget)
    // This invalidates the refresh token on server, but doesn't block UI
    if (refreshToken) {
      fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      }).catch(error => {
        // Silently ignore errors since user is already logged out on client
        console.error('Background logout error:', error);
      });
    }
    
    return { error: null };
  };

  const resetPassword = async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) return { data: null, error: { message: data.error || data.message } };
      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  };

  const changePassword = async (newPassword) => {
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await response.json();
      if (!response.ok) return { data: null, error: { message: data.error || data.message } };
      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  };

  const value = {
    user,
    loading,
    accessToken,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    signOut,
    resetPassword,
    changePassword,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

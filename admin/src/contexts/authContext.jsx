import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import authService from '../services/authService';

/**
 * Auth Context
 * Provides authentication state and methods throughout the app
 */
export const AuthContext = createContext({});

/**
 * Auth Provider Component
 * Wraps the app and provides auth context
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is authenticated
    const isAuthenticated = useMemo(() => !!user, [user]);

    // Check if user is admin
    const isAdmin = useMemo(() => user?.role === 'Admin', [user]);

    /**
     * Initialize auth state from localStorage
     */
    useEffect(() => {
        const initAuth = async () => {
            try {
                const accessToken = localStorage.getItem('adminAccessToken');
                const storedUser = localStorage.getItem('adminUser');

                if (accessToken && storedUser) {
                    // Verify token is still valid
                    try {
                        const result = await authService.getCurrentUser(accessToken);
                        setUser(result.user);
                    } catch {
                        // Token invalid, try refresh
                        const refreshToken = localStorage.getItem('adminRefreshToken');
                        if (refreshToken) {
                            try {
                                const refreshResult = await authService.refreshToken(refreshToken);
                                localStorage.setItem('adminAccessToken', refreshResult.session.accessToken);
                                localStorage.setItem('adminRefreshToken', refreshResult.session.refreshToken);
                                localStorage.setItem('adminUser', JSON.stringify(refreshResult.user));
                                setUser(refreshResult.user);
                            } catch {
                                // Refresh failed, clear everything
                                clearAuth();
                            }
                        } else {
                            clearAuth();
                        }
                    }
                }
            } catch (err) {
                console.error('Auth init error:', err);
                clearAuth();
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    /**
     * Clear auth data
     */
    const clearAuth = useCallback(() => {
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminUser');
        setUser(null);
    }, []);

    /**
     * Sign in with email and password
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>}
     */
    const signIn = useCallback(async (email, password) => {
        setError(null);

        try {
            const result = await authService.login(email, password);

            // Check admin role
            if (result.user.role !== 'admin') {
                throw new Error('Access denied. Admin privileges required.');
            }

            // Store tokens and user
            localStorage.setItem('adminAccessToken', result.session.accessToken);
            localStorage.setItem('adminRefreshToken', result.session.refreshToken);
            localStorage.setItem('adminUser', JSON.stringify(result.user));

            setUser(result.user);

            return { user: result.user, error: null };
        } catch (err) {
            setError(err.message);
            return { user: null, error: { message: err.message } };
        }
    }, []);

    /**
     * Sign out current user
     */
    const signOut = useCallback(async () => {
        try {
            const refreshToken = localStorage.getItem('adminRefreshToken');
            await authService.logout(refreshToken);
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            clearAuth();
        }
    }, [clearAuth]);

    // Context value
    const value = useMemo(() => ({
        user,
        isAuthenticated,
        isAdmin,
        isLoading,
        error,
        signIn,
        signOut,
    }), [user, isAuthenticated, isAdmin, isLoading, error, signIn, signOut]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;

import { useContext } from 'react';
import { AuthContext } from '../contexts/authContext.jsx';

/**
 * useAuth Hook
 * Access auth context values easily
 */
const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};

export default useAuth;

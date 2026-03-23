import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * Protected Route Component
 * Wraps routes that require admin authentication
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner"></div>
        <p>Verifying access...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <h1>🚫 Access Denied</h1>
          <p>You don't have permission to access this area.</p>
          <p>Admin privileges are required.</p>
          <button onClick={() => window.location.href = '/login'}>
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Render protected content
  return children;
}

export default ProtectedRoute;

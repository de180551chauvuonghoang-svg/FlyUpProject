import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a14]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a14] text-white p-4">
        <h1 className="text-4xl font-bold mb-4">🚫 Access Denied</h1>
        <p className="text-gray-400 mb-8 text-center max-w-md">
          You don't have permission to access the admin area. Admin privileges are required.
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return children;
};

export default AdminRoute;

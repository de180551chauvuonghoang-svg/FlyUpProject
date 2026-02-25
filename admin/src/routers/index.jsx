import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import Dashboard from '../pages/Dashboard';
import Users from '../pages/Users';
import Courses from '../pages/Courses';
import Login from '../pages/Login';
import UserDetail from '../pages/UserDetail';

const router = createBrowserRouter([
  // Public route - Login
  {
    path: '/login',
    element: <Login />,
  },
  // Protected routes - require admin auth
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'users',
        element: <Users />,
      },
      {
        path: 'users/:id',
        element: <UserDetail />,
      },
      {
        path: 'courses',
        element: <Courses />,
      },
      {
        path: 'courses/:id',
        element: <div className="coming-soon">Course Detail - Coming Soon</div>,
      },
      {
        path: 'orders',
        element: <div className="coming-soon">Orders - Coming Soon</div>,
      },
    ],
  },
]);

export default router;

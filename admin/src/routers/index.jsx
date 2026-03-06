import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import Dashboard from '../pages/Dashboard';
import Learners from '../pages/Learners';
import Instructors from '../pages/Instructors';
import Courses from '../pages/Courses';
import CourseDetail from '../pages/CourseDetail';
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
        path: 'learners',
        element: <Learners />,
      },
      {
        path: 'learners/:id',
        element: <UserDetail />,
      },
      {
        path: 'instructors',
        element: <Instructors />,
      },
      {
        path: 'instructors/:id',
        element: <UserDetail />,
      },
      {
        path: 'courses',
        element: <Courses />,
      },
      {
        path: 'courses/:id',
        element: <CourseDetail />,
      },
    ],
  },
]);

export default router;

import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/Dashboard';
import Users from '../pages/Users';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
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
        path: 'courses',
        element: <div className="coming-soon">Courses - Coming Soon</div>,
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

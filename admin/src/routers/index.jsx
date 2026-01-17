import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/Dashboard';

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
        path: 'courses',
        element: <div className="coming-soon">Course Grid - Coming Soon</div>,
      },
      {
        path: 'courses/:id',
        element: <div className="coming-soon">Course Detail - Coming Soon</div>,
      },
      {
        path: 'cadets',
        element: <div className="coming-soon">Cadets - Coming Soon</div>,
      },
      {
        path: 'analytics',
        element: <div className="coming-soon">Astrometrics - Coming Soon</div>,
      },
      {
        path: 'revenue',
        element: <div className="coming-soon">Revenue - Coming Soon</div>,
      },
    ],
  },
]);

export default router;

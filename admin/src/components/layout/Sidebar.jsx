import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  DollarSign,
  LogOut,
  Rocket
} from 'lucide-react';

/**
 * Menu items configuration
 */
const menuItems = [
  {
    path: '/dashboard',
    label: 'Command Deck',
    icon: LayoutDashboard,
  },
  {
    path: '/courses',
    label: 'Course Grid',
    icon: BookOpen,
  },
  {
    path: '/cadets',
    label: 'Cadets',
    icon: Users,
  },
  {
    path: '/analytics',
    label: 'Astrometrics',
    icon: BarChart3,
  },
  {
    path: '/revenue',
    label: 'Revenue',
    icon: DollarSign,
  },
];

/**
 * Sidebar Component
 * Navigation sidebar for admin panel
 */
function Sidebar() {
  const location = useLocation();

  const handleLogout = () => {
    // Clear auth token and redirect
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Rocket size={24} />
        </div>
        <div className="logo-text">
          <span className="logo-title">FLYUP</span>
          <span className="logo-subtitle">Admin Center</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path === '/dashboard' && location.pathname === '/');

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="nav-icon">
                <Icon size={20} />
              </div>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="sidebar-user">
        <div className="user-avatar">
          <img
            src="https://ui-avatars.com/api/?name=Admin&background=a855f7&color=0a0a1a&bold=true"
            alt="Admin"
          />
        </div>
        <div className="user-info">
          <span className="user-name">Dr. Admin</span>
        </div>
      </div>

      {/* Logout */}
      <button className="sidebar-logout" onClick={handleLogout}>
        <LogOut size={18} />
        <span>Terminal Exit</span>
      </button>
    </aside>
  );
}

export default Sidebar;

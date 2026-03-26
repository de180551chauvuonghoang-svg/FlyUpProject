import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  UserCog,
  LogOut,
  Bell
} from 'lucide-react';
import { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import notificationService from '../../../services/admin/notificationService';

/**
 * Menu items configuration
 */
const menuItems = [
  {
    path: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    path: '/admin/learners',
    label: 'Learners',
    icon: GraduationCap,
  },
  {
    path: '/admin/instructors',
    label: 'Instructors',
    icon: UserCog,
  },
  {
    path: '/admin/courses',
    label: 'Courses',
    icon: BookOpen,
  },

  {
    path: '/admin/notifications',
    label: 'Review Requests',
    icon: Bell,
    isNotification: true
  },
];

/**
 * Sidebar Component
 * Navigation sidebar for admin panel
 */
function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const result = await notificationService.getNotifications({ limit: 1, status: 'Pending' });
        setNotificationCount(result.pagination.totalItems || 0);
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
      }
    };

    fetchCount();
    // Poll every 2 minutes
    const interval = setInterval(fetchCount, 120000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon" style={{ background: 'none', boxShadow: 'none' }}>
          <img 
            src="/FlyUpTeam.png" 
            alt="FlyUp Logo" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />
        </div>
        <div className="logo-text">
          <img 
            src="/FLYUPTECHANDEDU.png" 
            alt="FlyUp Edu & Tech" 
            style={{ height: '32px', width: 'auto', objectFit: 'contain', marginBottom: '-4px' }}
          />
          <span className="logo-subtitle">Admin Center</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            location.pathname.startsWith(item.path + '/') ||
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
              {item.isNotification && notificationCount > 0 && (
                <span className="nav-badge">{notificationCount > 9 ? '9+' : notificationCount}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="sidebar-user">
        <div className="user-avatar">
          <img
            src={user?.avatar || "https://ui-avatars.com/api/?name=Admin&background=a855f7&color=0a0a1a&bold=true"}
            alt={user?.fullName || "Admin"}
          />
        </div>
        <div className="user-info">
          <span className="user-name">{user?.fullName || "Admin"}</span>
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

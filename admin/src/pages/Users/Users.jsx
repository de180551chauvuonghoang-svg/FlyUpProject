import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Lock, 
  Unlock, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Clock
} from 'lucide-react';

import userService from '../../services/userService';

/**
 * Users Page
 * User management with list, search, pagination, lock/unlock
 */
function Users() {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  // Ref to track if we should reset page
  const shouldResetPage = useRef(false);

  // Fetch users function
  const fetchUsers = async (page, search, status) => {
    try {
      setIsLoading(true);
      const result = await userService.getUsers({
        page,
        limit: itemsPerPage,
        search,
        status,
      });
      setUsers(result.users);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.totalItems);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and refetch on filter/search/page change
  useEffect(() => {
    let pageToFetch = currentPage;
    
    // If we should reset page (filter/search changed), use page 1
    if (shouldResetPage.current) {
      pageToFetch = 1;
      setCurrentPage(1);
      shouldResetPage.current = false;
    }
    
    fetchUsers(pageToFetch, searchQuery, statusFilter);
  }, [currentPage, searchQuery, statusFilter, itemsPerPage]);

  // Handle search
  const handleSearch = (e) => {
    shouldResetPage.current = true;
    setSearchQuery(e.target.value);
  };

  // Handle status filter
  const handleStatusFilter = (status) => {
    if (status === statusFilter) return;
    shouldResetPage.current = true;
    setStatusFilter(status);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  // Handle lock user
  const handleLockUser = async (userId) => {
    try {
      setActionLoading(userId);
      await userService.lockUser(userId);
      await fetchUsers(currentPage, searchQuery, statusFilter);
      setActiveDropdown(null);
    } catch (error) {
      console.error('Failed to lock user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle unlock user
  const handleUnlockUser = async (userId) => {
    try {
      setActionLoading(userId);
      await userService.unlockUser(userId);
      await fetchUsers(currentPage, searchQuery, statusFilter);
      setActiveDropdown(null);
    } catch (error) {
      console.error('Failed to unlock user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  // Pagination info
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  // Render table content
  const renderTableContent = () => {
    if (isLoading) {
      return [...Array(5)].map((_, i) => (
        <tr key={`skeleton-${i}`} className="skeleton-row">
          <td><div className="skeleton-cell wide"></div></td>
          <td><div className="skeleton-cell"></div></td>
          <td><div className="skeleton-cell short"></div></td>
          <td><div className="skeleton-cell short"></div></td>
          <td><div className="skeleton-cell"></div></td>
          <td><div className="skeleton-cell"></div></td>
          <td><div className="skeleton-cell short"></div></td>
        </tr>
      ));
    }
    
    if (users.length === 0) {
      return (
        <tr>
          <td colSpan="7" className="empty-state">
            <div className="empty-message">
              <p>No users found</p>
              <span>Try adjusting your search or filters</span>
            </div>
          </td>
        </tr>
      );
    }
    
    return users.map((user, index) => (
      <motion.tr
        key={user.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, duration: 0.2 }}
      >
        <td>
          <div className="user-cell">
            <img 
              src={user.avatar} 
              alt={user.fullName}
              className="user-avatar-small"
            />
            <div className="user-info-cell">
              <span className="user-name">{user.fullName}</span>
              <span className="user-id">ID: {user.id}</span>
            </div>
          </div>
        </td>
        <td>
          <div className="contact-cell">
            <span className="contact-item">
              <Mail size={12} />
              {user.email}
            </span>
            <span className="contact-item">
              <Phone size={12} />
              {user.phone}
            </span>
          </div>
        </td>
        <td>
          <span className={`role-badge ${user.role.toLowerCase()}`}>
            {user.role}
          </span>
        </td>
        <td>
          <span className={`status-badge ${user.status.toLowerCase()}`}>
            {user.status === 'LOCKED' && <Lock size={12} />}
            {user.status}
          </span>
        </td>
        <td>
          <span className="date-cell">
            <Calendar size={12} />
            {formatDate(user.createdAt)}
          </span>
        </td>
        <td>
          <span className="date-cell">
            <Clock size={12} />
            {formatDate(user.lastLogin)}
          </span>
        </td>
        <td>
          <div className="actions-cell">
            <button 
              className="action-menu-btn"
              onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
            >
              <MoreVertical size={16} />
            </button>
            
            {activeDropdown === user.id && (
              <div className="action-dropdown">
                {user.status === 'ACTIVE' ? (
                  <button 
                    className="dropdown-item danger"
                    onClick={() => handleLockUser(user.id)}
                    disabled={actionLoading === user.id}
                  >
                    <Lock size={14} />
                    {actionLoading === user.id ? 'Locking...' : 'Lock User'}
                  </button>
                ) : (
                  <button 
                    className="dropdown-item success"
                    onClick={() => handleUnlockUser(user.id)}
                    disabled={actionLoading === user.id}
                  >
                    <Unlock size={14} />
                    {actionLoading === user.id ? 'Unlocking...' : 'Unlock User'}
                  </button>
                )}
              </div>
            )}
          </div>
        </td>
      </motion.tr>
    ));
  };

  return (
    <div className="users-page">
      {/* Header */}
      <header className="page-header">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="page-title inline-title">
            <span className="title-accent">User</span>{' '}
            <span className="title-accent">Management</span>
          </h1>
          <p className="page-subtitle">
            View and manage all registered users in the system
          </p>
        </motion.div>
      </header>

      {/* Filters Section */}
      <section className="filters-section">
        <div className="search-filter">
          <div className="search-box large">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email or phone..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>

        <div className="status-filters">
          <Filter size={16} />
          <button 
            className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('ALL')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('ACTIVE')}
          >
            Active
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'LOCKED' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('LOCKED')}
          >
            Locked
          </button>
        </div>
      </section>

      {/* Users Table */}
      <section className="users-table-section">
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {renderTableContent()}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && users.length > 0 && (
          <div className="pagination-section">
            <div className="pagination-info">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, totalItems)} of{' '}
              {totalItems} users
            </div>
            
            <div className="pagination-controls">
              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPrevPage}
              >
                <ChevronLeft size={16} />
              </button>
              
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                ) : (
                  <button
                    key={page}
                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                )
              ))}
              
              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Users;

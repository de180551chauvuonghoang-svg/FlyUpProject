import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
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
import { useDebounce } from '../../hooks/useDebounce';
import { useClickOutside } from '../../hooks/useClickOutside';

/**
 * Instructors Page
 * Instructor management with list, search, pagination, lock/unlock
 */
function Instructors() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const searchQuery = useDebounce(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const shouldResetPage = useRef(false);
  const dropdownRef = useClickOutside(useCallback(() => setActiveDropdown(null), []));

  const fetchUsers = async (page, search, status) => {
    try {
      setIsLoading(true);
      const result = await userService.getUsers({
        page,
        limit: itemsPerPage,
        search,
        status,
        role: 'Instructor',
      });
      setUsers(result.users);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.totalItems);
    } catch (error) {
      toast.error('Failed to fetch instructors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let pageToFetch = currentPage;
    if (shouldResetPage.current) {
      pageToFetch = 1;
      setCurrentPage(1);
      shouldResetPage.current = false;
    }
    fetchUsers(pageToFetch, searchQuery, statusFilter);
  }, [currentPage, searchQuery, statusFilter, itemsPerPage]);

  const handleSearch = (e) => {
    shouldResetPage.current = true;
    setSearchInput(e.target.value);
  };

  const handleStatusFilter = (status) => {
    if (status === statusFilter) return;
    shouldResetPage.current = true;
    setStatusFilter(status);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  const handleLockUser = async (userId) => {
    if (!window.confirm('Are you sure you want to lock this instructor?')) return;
    try {
      setActionLoading(userId);
      await userService.lockUser(userId);
      toast.success('Instructor locked successfully');
      await fetchUsers(currentPage, searchQuery, statusFilter);
      setActiveDropdown(null);
    } catch (error) {
      toast.error('Failed to lock instructor');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlockUser = async (userId) => {
    if (!window.confirm('Are you sure you want to unlock this instructor?')) return;
    try {
      setActionLoading(userId);
      await userService.unlockUser(userId);
      toast.success('Instructor unlocked successfully');
      await fetchUsers(currentPage, searchQuery, statusFilter);
      setActiveDropdown(null);
    } catch (error) {
      toast.error('Failed to unlock instructor');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
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

  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const renderTableContent = () => {
    if (isLoading) {
      return [...Array(5)].map((_, i) => (
        <tr key={`skeleton-${i}`} className="skeleton-row">
          <td><div className="skeleton-cell wide"></div></td>
          <td><div className="skeleton-cell"></div></td>
          <td><div className="skeleton-cell short"></div></td>
          <td><div className="skeleton-cell short"></div></td>
          <td><div className="skeleton-cell"></div></td>
          <td><div className="skeleton-cell short"></div></td>
        </tr>
      ));
    }

    if (users.length === 0) {
      return (
        <tr>
          <td colSpan="6" className="empty-state">
            <div className="empty-message">
              <p>No instructors found</p>
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
        onClick={() => navigate(`/instructors/${user.id}`)}
        style={{ cursor: 'pointer' }}
        title="Click to view instructor detail"
      >
        <td>
          <div className="user-cell">
            <img src={user.avatar} alt={user.fullName} className="user-avatar-small" />
            <div className="user-info-cell">
              <span className="user-name">{user.fullName}</span>
              <span className="user-id">ID: {user.id}</span>
            </div>
          </div>
        </td>
        <td>
          <div className="contact-cell">
            <span className="contact-item"><Mail size={12} />{user.email}</span>
            <span className="contact-item"><Phone size={12} />{user.phone}</span>
          </div>
        </td>
        <td>
          <span className={`status-badge ${user.status.toLowerCase()}`}>
            {user.status === 'LOCKED' && <Lock size={12} />}
            {user.status}
          </span>
        </td>
        <td>
          <span className="date-cell"><Calendar size={12} />{formatDate(user.createdAt)}</span>
        </td>
        <td>
          <span className="date-cell"><Clock size={12} />{formatDate(user.lastLogin)}</span>
        </td>
        <td>
          <div className="actions-cell" ref={activeDropdown === user.id ? dropdownRef : null}>
            <button
              className="action-menu-btn"
              onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === user.id ? null : user.id); }}
            >
              <MoreVertical size={16} />
            </button>
            {activeDropdown === user.id && (
              <div className="action-dropdown">
                {user.status === 'ACTIVE' ? (
                  <button
                    className="dropdown-item danger"
                    onClick={(e) => { e.stopPropagation(); handleLockUser(user.id); }}
                    disabled={actionLoading === user.id}
                  >
                    <Lock size={14} />
                    {actionLoading === user.id ? 'Locking...' : 'Lock User'}
                  </button>
                ) : (
                  <button
                    className="dropdown-item success"
                    onClick={(e) => { e.stopPropagation(); handleUnlockUser(user.id); }}
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
      <header className="page-header">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="page-title inline-title">
            <span className="title-accent">Instructor</span>{' '}
            <span className="title-accent">Management</span>
          </h1>
        </motion.div>
      </header>

      <section className="filters-section">
        <div className="search-filter">
          <div className="search-box large">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchInput}
              onChange={handleSearch}
            />
          </div>
        </div>
        <div className="status-filters">
          <Filter size={16} />
          <button className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`} onClick={() => handleStatusFilter('ALL')}>All</button>
          <button className={`filter-btn ${statusFilter === 'ACTIVE' ? 'active' : ''}`} onClick={() => handleStatusFilter('ACTIVE')}>Active</button>
          <button className={`filter-btn ${statusFilter === 'LOCKED' ? 'active' : ''}`} onClick={() => handleStatusFilter('LOCKED')}>Locked</button>
        </div>
      </section>

      <section className="users-table-section">
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Instructor</th>
                <th>Contact</th>
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

        {!isLoading && users.length > 0 && (
          <div className="pagination-section">
            <div className="pagination-info">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, totalItems)} of{' '}
              {totalItems} instructors
            </div>
            <div className="pagination-controls">
              <button className="pagination-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={!hasPrevPage}>
                <ChevronLeft size={16} />
              </button>
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                ) : (
                  <button key={page} className={`pagination-btn ${currentPage === page ? 'active' : ''}`} onClick={() => handlePageChange(page)}>{page}</button>
                )
              ))}
              <button className="pagination-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={!hasNextPage}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Instructors;

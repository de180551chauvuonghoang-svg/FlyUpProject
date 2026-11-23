import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Filter,
    MoreVertical,
    CheckCircle,
    XCircle,
    Clock,
    Archive,
    RotateCcw,
    Users,
    Star,
    PlayCircle,
    DollarSign,
    SlidersHorizontal,
    Trash2,
    AlertTriangle
} from 'lucide-react';

import courseService from '../../../services/admin/courseService';
import '../CourseDetail/CourseDetail.css';
import { useDebounce } from '../../../hooks/useDebounce';
import { useClickOutside } from '../../../hooks/useClickOutside';

/**
 * Courses Page
 * Course management with list, search, pagination, approve/reject
 */
function Courses() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage] = useState(10);
    const [searchInput, setSearchInput] = useState('');
    const searchQuery = useDebounce(searchInput, 400);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('newest');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [courseToReject, setCourseToReject] = useState(null);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [archiveReason, setArchiveReason] = useState('');
    const [courseToArchive, setCourseToArchive] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState(null);

    // Ref to track if we should reset page
    const shouldResetPage = useRef(false);
    const dropdownRef = useClickOutside(useCallback(() => setActiveDropdown(null), []));

    // Fetch courses function
    const fetchCourses = async (page, search, status) => {
        try {
            setIsLoading(true);
            const result = await courseService.getCourses({
                page,
                limit: itemsPerPage,
                search,
                status,
                sort: sortBy,
            });
            setCourses(result.courses);
            setTotalPages(result.pagination.totalPages);
            setTotalItems(result.pagination.totalItems);
        } catch (error) {
            toast.error('Failed to fetch courses');
        } finally {
            setIsLoading(false);
        }
    };

    // Initial fetch and refetch on filter/search/page change
    useEffect(() => {
        let pageToFetch = currentPage;

        if (shouldResetPage.current) {
            pageToFetch = 1;
            setCurrentPage(1);
            shouldResetPage.current = false;
        }

        fetchCourses(pageToFetch, searchQuery, statusFilter);
    }, [currentPage, searchQuery, statusFilter, sortBy, itemsPerPage]);

    // Handle search
    const handleSearch = (e) => {
        shouldResetPage.current = true;
        setSearchInput(e.target.value);
    };

    // Handle status filter
    const handleStatusFilter = (status) => {
        if (status === statusFilter) return;
        shouldResetPage.current = true;
        setStatusFilter(status);
    };

    // Handle sort
    const handleSort = (sort) => {
        shouldResetPage.current = true;
        setSortBy(sort);
        setShowSortDropdown(false);
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
            setCurrentPage(newPage);
        }
    };

    // Handle approve course
    const handleApproveCourse = async (courseId) => {
        try {
            setActionLoading(courseId);
            await courseService.approveCourse(courseId);
            toast.success('Course approved successfully');
            await fetchCourses(currentPage, searchQuery, statusFilter);
            setActiveDropdown(null);
        } catch (error) {
            toast.error('Failed to approve course');
        } finally {
            setActionLoading(null);
        }
    };

    // Handle reject course
    const handleRejectCourse = (courseId) => {
        const course = courses.find(c => c.id === courseId);
        setCourseToReject(course);
        setRejectReason('');
        setIsRejectModalOpen(true);
        setActiveDropdown(null);
    };

    const confirmRejectCourse = async () => {
        if (!courseToReject) return;
        try {
            setActionLoading(courseToReject.id);
            await courseService.rejectCourse(courseToReject.id, rejectReason || 'Content does not meet quality standards');
            toast.success('Course rejected');
            setIsRejectModalOpen(false);
            setCourseToReject(null);
            await fetchCourses(currentPage, searchQuery, statusFilter);
        } catch (error) {
            toast.error('Failed to reject course');
        } finally {
            setActionLoading(null);
        }
    };

    const handleArchiveCourse = (courseId) => {
        const course = courses.find(c => c.Id === courseId);
        setCourseToArchive(course);
        setIsArchiveModalOpen(true);
        setActiveDropdown(null);
    };

    const confirmArchiveCourse = async () => {
        if (!courseToArchive) return;
        try {
            setActionLoading(courseToArchive.Id);
            await courseService.archiveCourse(courseToArchive.Id, archiveReason || 'Course content is no longer required or has been replaced.');
            toast.success('Course archived');
            setIsArchiveModalOpen(false);
            setArchiveReason('');
            setCourseToArchive(null);
            await fetchCourses(currentPage, searchQuery, statusFilter);
        } catch (error) {
            toast.error('Failed to archive course');
        } finally {
            setActionLoading(null);
        }
    };

    // Handle unarchive course
    const handleUnarchiveCourse = async (courseId) => {
        try {
            setActionLoading(courseId);
            await courseService.unarchiveCourse(courseId);
            toast.success('Course unarchived');
            await fetchCourses(currentPage, searchQuery, statusFilter);
            setActiveDropdown(null);
        } catch (error) {
            toast.error('Failed to unarchive course');
        } finally {
            setActionLoading(null);
        }
    };

    // Handle delete course
    const handleDeleteCourse = (courseId) => {
        const course = courses.find(c => c.id === courseId);
        setCourseToDelete(course);
        setIsDeleteModalOpen(true);
        setActiveDropdown(null);
    };

    const confirmDeleteCourse = async () => {
        if (!courseToDelete) return;
        try {
            setActionLoading(courseToDelete.id);
            await courseService.deleteCourse(courseToDelete.id);
            toast.success('Course deleted permanently');
            setIsDeleteModalOpen(false);
            setCourseToDelete(null);
            await fetchCourses(currentPage, searchQuery, statusFilter);
        } catch (error) {
            toast.error(error.message || 'Failed to delete course');
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

    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(price);
    };

    // Get status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING':
                return <Clock size={12} />;
            case 'APPROVED':
                return <CheckCircle size={12} />;
            case 'REJECTED':
                return <XCircle size={12} />;
            case 'ARCHIVED':
                return <Archive size={12} />;
            default:
                return null;
        }
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
                    <td><div className="skeleton-cell short"></div></td>
                </tr>
            ));
        }

        if (courses.length === 0) {
            return (
                <tr>
                    <td colSpan="6" className="empty-state">
                        <div className="empty-message">
                            <p>No courses found</p>
                            <span>Try adjusting your search or filters</span>
                        </div>
                    </td>
                </tr>
            );
        }

        return courses.map((course, index) => (
            <motion.tr
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                onClick={() => navigate(`/admin/courses/${course.id}`)}
                style={{ cursor: 'pointer' }}
                className="clickable-row"
            >
                <td>
                    <div className="course-cell">
                        <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="course-thumbnail-small"
                        />
                        <div className="course-info-cell">
                            <span className="course-title-text">{course.title}</span>
                            <span className="course-category">{course.category}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div className="instructor-cell">
                        <img
                            src={course.instructor.avatar}
                            alt={course.instructor.name}
                            className="instructor-avatar"
                        />
                        <span>{course.instructor.name}</span>
                    </div>
                </td>
                <td>
                    <div className="course-stats-cell">
                        <span className="stat-item">
                            <PlayCircle size={12} />
                            {course.totalLessons} lessons
                        </span>
                        <span className="stat-item">
                            <Clock size={12} />
                            {course.totalDuration}
                        </span>
                    </div>
                </td>
                <td>
                    <span className={`status-badge ${course.status.toLowerCase()}`}>
                        {getStatusIcon(course.status)}
                        {course.status}
                    </span>
                </td>
                <td>
                    <div className="course-metrics">
                        <span className="metric-item">
                            <DollarSign size={12} />
                            {formatPrice(course.price)}
                        </span>
                        {course.status === 'APPROVED' && (
                            <>
                                <span className="metric-item">
                                    <Users size={12} />
                                    {course.enrolledCount}
                                </span>
                                <span className="metric-item">
                                    <Star size={12} />
                                    {course.rating}
                                </span>
                            </>
                        )}
                    </div>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                    <div className="actions-cell" ref={activeDropdown === course.id ? dropdownRef : null}>
                        <button
                            className="action-menu-btn"
                            onClick={() => setActiveDropdown(activeDropdown === course.id ? null : course.id)}
                        >
                            <MoreVertical size={16} />
                        </button>

                        {activeDropdown === course.id && (
                            <div className="action-dropdown">
                                {course.status === 'PENDING' && (
                                    <>
                                        <button
                                            className="dropdown-item success"
                                            onClick={() => handleApproveCourse(course.id)}
                                            disabled={actionLoading === course.id}
                                        >
                                            <CheckCircle size={14} />
                                            {actionLoading === course.id ? 'Approving...' : 'Approve'}
                                        </button>
                                        <button
                                            className="dropdown-item danger"
                                            onClick={() => handleRejectCourse(course.id)}
                                            disabled={actionLoading === course.id}
                                        >
                                            <XCircle size={14} />
                                            {actionLoading === course.id ? 'Rejecting...' : 'Reject'}
                                        </button>
                                    </>
                                )}
                                {course.status === 'APPROVED' && (
                                    <button
                                        className="dropdown-item warning"
                                        onClick={() => handleArchiveCourse(course.id)}
                                        disabled={actionLoading === course.id}
                                    >
                                        <Archive size={14} />
                                        {actionLoading === course.id ? 'Archiving...' : 'Archive'}
                                    </button>
                                )}
                                {course.status === 'REJECTED' && (
                                    <button
                                        className="dropdown-item success"
                                        onClick={() => handleApproveCourse(course.id)}
                                        disabled={actionLoading === course.id}
                                    >
                                        <CheckCircle size={14} />
                                        {actionLoading === course.id ? 'Approving...' : 'Approve'}
                                    </button>
                                )}
                                {course.status === 'ARCHIVED' && (
                                    <button
                                        className="dropdown-item success"
                                        onClick={() => handleUnarchiveCourse(course.id)}
                                        disabled={actionLoading === course.id}
                                    >
                                        <RotateCcw size={14} />
                                        {actionLoading === course.id ? 'Unarchiving...' : 'Unarchive'}
                                    </button>
                                )}
                                <button
                                    className="dropdown-item danger"
                                    onClick={() => handleDeleteCourse(course.id)}
                                    disabled={actionLoading === course.id}
                                >
                                    <Trash2 size={14} />
                                    {actionLoading === course.id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        )}
                    </div>
                </td>
            </motion.tr>
        ));
    };

    return (
        <div className="courses-page">
            {/* Header */}
            <header className="page-header">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="page-title inline-title">
                        <span className="title-accent">Course</span>{' '}
                        <span className="title-accent">Management</span>
                    </h1>
                </motion.div>
            </header>

            {/* Filters Section */}
            <section className="filters-section" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '16px', alignItems: 'center' }}>
                <div className="search-filter" style={{ flex: '1 1 auto', minWidth: '280px', maxWidth: '400px' }}>
                    <div className="search-box large" style={{ margin: 0, width: '100%' }}>
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchInput}
                            onChange={handleSearch}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                    {/* Sort Dropdown */}
                    <div style={{ position: 'relative', zIndex: 100 }}>
                        <button
                            onClick={() => setShowSortDropdown(!showSortDropdown)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: sortBy !== 'newest' ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.05)',
                                color: sortBy !== 'newest' ? '#a855f7' : '#fff',
                                border: sortBy !== 'newest' ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px', padding: '0 14px', height: '42px',
                                cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap'
                            }}
                        >
                            <SlidersHorizontal size={16} />
                            {sortBy === 'newest' ? 'Sort' : sortBy === 'mostEnrolled' ? 'Most Enrolled' : 'Oldest'}
                        </button>
                        {showSortDropdown && (
                            <div style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                                background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px', overflow: 'hidden', zIndex: 50,
                                minWidth: '160px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                            }}>
                                {[{ key: 'newest', label: 'Newest' }, { key: 'oldest', label: 'Oldest' }, { key: 'mostEnrolled', label: 'Most Enrolled' }].map(opt => (
                                    <button
                                        key={opt.key}
                                        onClick={() => handleSort(opt.key)}
                                        style={{
                                            display: 'block', width: '100%', textAlign: 'left',
                                            padding: '10px 14px', border: 'none', cursor: 'pointer',
                                            fontSize: '13px',
                                            background: sortBy === opt.key ? 'rgba(168,85,247,0.15)' : 'transparent',
                                            color: sortBy === opt.key ? '#a855f7' : '#d1d5db',
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Status Tabs */}
                    <div className="status-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', margin: 0 }}>
                        <Filter size={16} style={{ marginRight: '4px' }} />
                        <button
                            className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                            onClick={() => handleStatusFilter('ALL')}
                        >
                            All
                        </button>
                        <button
                            className={`filter-btn ${statusFilter === 'PENDING' ? 'active' : ''}`}
                            onClick={() => handleStatusFilter('PENDING')}
                        >
                            Pending
                        </button>
                        <button
                            className={`filter-btn ${statusFilter === 'APPROVED' ? 'active' : ''}`}
                            onClick={() => handleStatusFilter('APPROVED')}
                        >
                            Approved
                        </button>
                        <button
                            className={`filter-btn ${statusFilter === 'REJECTED' ? 'active' : ''}`}
                            onClick={() => handleStatusFilter('REJECTED')}
                        >
                            Rejected
                        </button>
                        <button
                            className={`filter-btn ${statusFilter === 'ARCHIVED' ? 'active' : ''}`}
                            onClick={() => handleStatusFilter('ARCHIVED')}
                        >
                            Archived
                        </button>
                    </div>
                </div>
            </section>

            {/* Courses Table */}
            <section className="courses-table-section">
                <div className="table-container">
                    <table className="courses-table">
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Instructor</th>
                                <th>Content</th>
                                <th>Status</th>
                                <th>Preview</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderTableContent()}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isLoading && courses.length > 0 && (
                    <div className="pagination-section">
                        <div className="pagination-info">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                            {Math.min(currentPage * itemsPerPage, totalItems)} of{' '}
                            {totalItems} courses
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
        
            {/* Rejection Modal */}
            {isRejectModalOpen && (
                <div className="cd-modal-overlay" onClick={() => { setIsRejectModalOpen(false); setCourseToReject(null); }}>
                    <motion.div 
                        className="cd-modal-content"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="cd-modal-header">
                            <XCircle className="cd-modal-icon" size={24} />
                            <h3>Reject Course</h3>
                        </div>
                        <div className="cd-modal-body">
                            <p>Are you sure you want to reject <strong>{courseToReject?.Title || courseToReject?.title}</strong>? This will notify the instructor.</p>
                            <label className="cd-modal-label">Reason for Rejection</label>
                            <textarea
                                className="cd-modal-textarea"
                                placeholder="e.g. Quality standards not met, missing resources..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="cd-modal-footer">
                            <button 
                                className="cd-modal-btn cd-modal-btn-cancel"
                                onClick={() => { setIsRejectModalOpen(false); setCourseToReject(null); }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="cd-modal-btn cd-modal-btn-confirm"
                                onClick={confirmRejectCourse}
                                disabled={actionLoading === (courseToReject?.id || courseToReject?.Id)}
                            >
                                {actionLoading === (courseToReject?.id || courseToReject?.Id) ? 'Processing...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Archive Modal */}
            {isArchiveModalOpen && (
                <div className="cd-modal-overlay" onClick={() => { setIsArchiveModalOpen(false); setCourseToArchive(null); }}>
                    <motion.div
                        className="cd-modal-content"
                        style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="cd-modal-header">
                            <Archive className="cd-modal-icon" style={{ color: '#f59e0b' }} size={24} />
                            <h3>Archive Course</h3>
                        </div>
                        <div className="cd-modal-body">
                            <p>Are you sure you want to archive <strong>{courseToArchive?.Title}</strong>? This will hide the course from the public listing.</p>
                            <label className="cd-modal-label">Reason for Archiving (Optional)</label>
                            <textarea
                                className="cd-modal-textarea"
                                placeholder="Provide a reason for the instructor..."
                                value={archiveReason}
                                onChange={(e) => setArchiveReason(e.target.value)}
                                spellCheck="false"
                            />
                        </div>
                        <div className="cd-modal-footer">
                            <button
                                className="cd-modal-btn cd-modal-btn-cancel"
                                onClick={() => { setIsArchiveModalOpen(false); setCourseToArchive(null); setArchiveReason(''); }}
                                disabled={!!actionLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="cd-modal-btn cd-modal-btn-confirm"
                                style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
                                onClick={confirmArchiveCourse}
                                disabled={!!actionLoading}
                            >
                                {actionLoading === (courseToArchive?.id || courseToArchive?.Id) ? (
                                    <div className="cd-btn-spinner" />
                                ) : (
                                    <>
                                        <Archive size={16} />
                                        Archive Course
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="cd-modal-overlay" onClick={() => { setIsDeleteModalOpen(false); setCourseToDelete(null); }}>
                    <motion.div 
                        className="cd-modal-content"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="cd-modal-header logout-header">
                            <div className="cd-modal-icon-container" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                <AlertTriangle size={24} />
                            </div>
                            <h2 className="cd-modal-title">Delete Course</h2>
                        </div>
                        
                        <div className="cd-modal-body">
                            <p className="cd-modal-desc" style={{ textAlign: 'center', marginBottom: '24px' }}>
                                Are you sure you want to permanently delete <strong>{courseToDelete?.title}</strong>? 
                                <br />
                                This action <span style={{ color: '#ef4444', fontWeight: 'bold' }}>cannot be undone</span>.
                            </p>
                        </div>

                        <div className="cd-modal-footer">
                            <button 
                                className="cd-modal-btn cd-modal-btn-cancel"
                                onClick={() => { setIsDeleteModalOpen(false); setCourseToDelete(null); }}
                                disabled={!!actionLoading}
                            >
                                No, Keep it
                            </button>
                            <button 
                                className="cd-modal-btn cd-modal-btn-confirm"
                                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                                onClick={confirmDeleteCourse}
                                disabled={!!actionLoading}
                            >
                                {actionLoading === (courseToDelete?.id || courseToDelete?.Id) ? (
                                    <div className="cd-btn-spinner" />
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        Permanently Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>

    );
}

export default Courses;

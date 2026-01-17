import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
    Users,
    Star,
    PlayCircle,
    DollarSign
} from 'lucide-react';

import courseService from '../../services/courseService';

/**
 * Courses Page
 * Course management with list, search, pagination, approve/reject
 */
function Courses() {
    const [courses, setCourses] = useState([]);
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

    // Fetch courses function
    const fetchCourses = async (page, search, status) => {
        try {
            setIsLoading(true);
            const result = await courseService.getCourses({
                page,
                limit: itemsPerPage,
                search,
                status,
            });
            setCourses(result.courses);
            setTotalPages(result.pagination.totalPages);
            setTotalItems(result.pagination.totalItems);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
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

    // Handle approve course
    const handleApproveCourse = async (courseId) => {
        try {
            setActionLoading(courseId);
            await courseService.approveCourse(courseId);
            await fetchCourses(currentPage, searchQuery, statusFilter);
            setActiveDropdown(null);
        } catch (error) {
            console.error('Failed to approve course:', error);
        } finally {
            setActionLoading(null);
        }
    };

    // Handle reject course
    const handleRejectCourse = async (courseId) => {
        try {
            setActionLoading(courseId);
            await courseService.rejectCourse(courseId, 'Content does not meet quality standards');
            await fetchCourses(currentPage, searchQuery, statusFilter);
            setActiveDropdown(null);
        } catch (error) {
            console.error('Failed to reject course:', error);
        } finally {
            setActionLoading(null);
        }
    };

    // Handle archive course
    const handleArchiveCourse = async (courseId) => {
        try {
            setActionLoading(courseId);
            await courseService.archiveCourse(courseId);
            await fetchCourses(currentPage, searchQuery, statusFilter);
            setActiveDropdown(null);
        } catch (error) {
            console.error('Failed to archive course:', error);
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
                <td>
                    <div className="actions-cell">
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
                    <p className="page-subtitle">
                        Review, approve, and manage all courses in the system
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
                            placeholder="Search by title, instructor or category..."
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
                                <th>Metrics</th>
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
        </div>
    );
}

export default Courses;

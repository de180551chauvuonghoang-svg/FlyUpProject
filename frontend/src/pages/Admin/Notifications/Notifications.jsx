import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
    Bell, 
    Calendar, 
    User, 
    BookOpen, 
    ChevronRight,
    Search,
    Filter,
    Clock,
    CheckCircle
} from 'lucide-react';
import notificationService from '../../../services/admin/notificationService';

/**
 * Notifications Page (Review Requests)
 * Displays list of course submission requests from instructors
 */
function Notifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('Pending');

    const fetchNotifications = async (page, status) => {
        try {
            setIsLoading(true);
            const result = await notificationService.getNotifications({ page, status });
            setNotifications(result.notifications);
            setTotalPages(result.pagination.totalPages);
        } catch (error) {
            toast.error('Failed to load request list');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications(currentPage, statusFilter);
    }, [currentPage, statusFilter]);

    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            toast.success('Marked as seen');
            fetchNotifications(currentPage, statusFilter);
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const handleViewCourse = (courseId) => {
        navigate(`/admin/courses/${courseId}`);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="notifications-page admin-wrapper">
            <header className="page-header">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="page-title inline-title">
                        <span className="title-accent">Review</span>{' '}
                        <span className="title-main">Requests</span>
                    </h1>
                    <p className="page-subtitle">Manage course publication requests from instructors</p>
                </motion.div>
            </header>

            <section className="filters-section">
                <div className="status-filters">
                    <Filter size={16} />
                    <button 
                        className={`filter-btn ${statusFilter === 'Pending' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('Pending')}
                    >
                        Pending
                    </button>
                    <button 
                        className={`filter-btn ${statusFilter === 'Read' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('Read')}
                    >
                        Seen
                    </button>
                    <button 
                        className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('ALL')}
                    >
                        All
                    </button>
                </div>
            </section>

            <div className="notifications-list">
                {isLoading ? (
                    <div className="loading-state">
                        <div className="loading-pulse"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="empty-state card">
                        <Bell size={48} className="empty-icon" />
                        <h3>No requests found</h3>
                        <p>All requests have been processed or there are no new requests.</p>
                    </div>
                ) : (
                    <div className="notification-grid">
                        {notifications.map((notif, index) => (
                            <motion.div
                                key={notif.Id}
                                className={`notification-card card ${notif.Status === 'Pending' ? 'unread' : ''}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="notif-header">
                                    <div className="notif-type">
                                        <BookOpen size={16} />
                                        <span>Course Review Request</span>
                                    </div>
                                    <span className="notif-time">
                                        <Calendar size={14} />
                                        {formatDate(notif.CreationTime)}
                                    </span>
                                </div>
                                <div className="notif-body">
                                    <h3 className="notif-course-title">{notif.CourseTitle}</h3>
                                    <div className="notif-instructor">
                                        <User size={14} />
                                        <span>Instructor: {notif.InstructorName}</span>
                                    </div>
                                </div>
                                <div className="notif-footer">
                                    <button 
                                        className="btn-secondary"
                                        onClick={() => handleViewCourse(notif.CourseId)}
                                    >
                                        View Course
                                        <ChevronRight size={16} />
                                    </button>
                                    {notif.Status === 'Pending' && (
                                        <button 
                                            className="btn-ghost"
                                            onClick={() => handleMarkAsRead(notif.Id)}
                                        >
                                            <CheckCircle size={16} />
                                            Mark as seen
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .notification-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 20px;
                    margin-top: 24px;
                }
                .notification-card {
                    padding: 24px;
                    background: var(--color-bg-card);
                    border: 1px solid var(--color-border);
                    border-radius: 16px;
                    transition: all 0.3s ease;
                }
                .notification-card:hover {
                    transform: translateY(-4px);
                    border-color: var(--color-accent-primary);
                    box-shadow: var(--shadow-glow-primary);
                }
                .notification-card.unread {
                    border-left: 4px solid var(--color-accent-primary);
                }
                .notif-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                .notif-type {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                    color: var(--color-accent-primary);
                    font-weight: 600;
                    text-transform: uppercase;
                }
                .notif-time {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: var(--color-text-muted);
                }
                .notif-course-title {
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    color: var(--color-text-primary);
                }
                .notif-instructor {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    color: var(--color-text-secondary);
                }
                .notif-footer {
                    margin-top: 24px;
                    display: flex;
                    gap: 12px;
                }
                .btn-secondary {
                    background: var(--color-bg-secondary);
                    color: var(--color-text-primary);
                    border: 1px solid var(--color-border);
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .btn-secondary:hover {
                    background: var(--color-accent-primary);
                    border-color: var(--color-accent-primary);
                }
                .btn-ghost {
                    background: transparent;
                    color: var(--color-text-muted);
                    border: none;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                }
                .btn-ghost:hover {
                    color: var(--color-accent-green);
                }
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 40px;
                    text-align: center;
                }
                .empty-icon {
                    color: var(--color-text-muted);
                    margin-bottom: 24px;
                    opacity: 0.3;
                }
            ` }} />
        </div>
    );
}

export default Notifications;

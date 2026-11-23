import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Lock,
    Unlock,
    Mail,
    Phone,
    Calendar,
    Clock,
    Shield,
    BookOpen,
    BadgeCheck,
    Wallet,
    User,
    AtSign,
    Cake,
    LogIn,
    AlertCircle,
    CheckCircle2,
    Receipt,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    ChevronDown,
    Users,
} from 'lucide-react';

import userService from '../../../services/admin/userService';
import { formatDate, formatCurrency } from '../../../utils/admin/formatters';
import './UserDetail.css';

function UserDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Transaction state
    const [transactions, setTransactions] = useState([]);
    const [txPagination, setTxPagination] = useState(null);
    const [txPage, setTxPage] = useState(1);
    const [txLoading, setTxLoading] = useState(false);
    const [isSalesHistory, setIsSalesHistory] = useState(false);

    const [courses, setCourses] = useState([]);
    const [showCourses, setShowCourses] = useState(false);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [isLockModalOpen, setIsLockModalOpen] = useState(false);
    const [lockReason, setLockReason] = useState('');

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchUser = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const result = await userService.getUserById(id);
            setUser(result.user);
        } catch (err) {
            setError(err.message || 'Failed to load user');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTransactions = async (page = 1) => {
        try {
            setTxLoading(true);
            const result = await userService.getUserTransactions(id, { page, limit: 5 });
            setTransactions(result.transactions);
            setTxPagination(result.pagination);
            setIsSalesHistory(result.isInstructor);
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
        } finally {
            setTxLoading(false);
        }
    };

    useEffect(() => {
        setTxPage(1);
        fetchUser();
    }, [id]);

    useEffect(() => {
        fetchTransactions(txPage);
    }, [id, txPage]);

    const handleToggleCourses = async () => {
        if (showCourses) {
            setShowCourses(false);
            return;
        }
        try {
            setCoursesLoading(true);
            let result;
            if (user?.role?.toUpperCase() === 'INSTRUCTOR') {
                result = await userService.getUserCourses(id);
            } else {
                result = await userService.getUserEnrollments(id);
            }
            setCourses(result.courses || []);
            setShowCourses(true);
        } catch (err) {
            console.error('Failed to fetch courses/enrollments:', err);
            showToast('Failed to load courses', 'error');
        } finally {
            setCoursesLoading(false);
        }
    };

    const handleLock = () => {
        setLockReason('');
        setIsLockModalOpen(true);
    };

    const confirmLock = async () => {
        try {
            setActionLoading(true);
            await userService.lockUser(id, lockReason || 'Violation of terms of service');
            showToast('User locked successfully');
            setIsLockModalOpen(false);
            await fetchUser();
        } catch (err) {
            showToast(err.message || 'Failed to lock user', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnlock = async () => {
        try {
            setActionLoading(true);
            await userService.unlockUser(id);
            showToast('User unlocked successfully');
            await fetchUser();
        } catch (err) {
            showToast(err.message || 'Failed to unlock user', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="ud-loading-screen">
                <div className="ud-spinner" />
                <span>Loading user details...</span>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="ud-error-screen">
                <AlertCircle size={48} />
                <h2>User not found</h2>
                <p>{error || 'The requested user does not exist.'}</p>
                <button className="ud-btn ud-btn-primary" onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} /> Go Back
                </button>
            </div>
        );
    }

    const isActive = user.status === 'ACTIVE';
    const isAdmin = user.role === 'Admin';

    return (
        <div className="ud-page">
            {/* Toast */}
            {toast && (
                <motion.div
                    className={`ud-toast ${toast.type}`}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                >
                    {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {toast.message}
                </motion.div>
            )}

            {/* Back Button */}
            <motion.button
                className="ud-back-btn"
                onClick={() => navigate(-1)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <ArrowLeft size={16} />
                Back
            </motion.button>

            {/* Profile Header Card */}
            <motion.div
                className="ud-profile-header"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <div className="ud-profile-left">
                    <div className="ud-avatar-wrap">
                        <img src={user.avatar} alt={user.fullName} className="ud-avatar" />
                        <span className={`ud-avatar-status ${isActive ? 'active' : 'locked'}`} />
                    </div>

                    <div className="ud-profile-info">
                        <div className="ud-name-row">
                            <h1 className="ud-name">{user.fullName}</h1>
                            {user.isVerified && (
                                <span className="ud-verified-badge" title="Verified">
                                    <BadgeCheck size={18} />
                                </span>
                            )}
                        </div>
                        <p className="ud-username">@{user.userName}</p>
                        <div className="ud-badges-row">
                            <span className={`ud-role-badge ${user.role.toLowerCase()}`}>{user.role}</span>
                            <span className={`ud-status-badge ${user.status.toLowerCase()}`}>
                                {isActive ? <CheckCircle2 size={12} /> : <Lock size={12} />}
                                {user.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                {!isAdmin && (
                    <div className="ud-profile-actions">
                        {isActive ? (
                            <button
                                className="ud-btn ud-btn-danger"
                                onClick={handleLock}
                                disabled={actionLoading}
                            >
                                <Lock size={15} />
                                {actionLoading ? 'Locking...' : 'Lock User'}
                            </button>
                        ) : (
                            <button
                                className="ud-btn ud-btn-success"
                                onClick={handleUnlock}
                                disabled={actionLoading}
                            >
                                <Unlock size={15} />
                                {actionLoading ? 'Unlocking...' : 'Unlock User'}
                            </button>
                        )}
                    </div>
                )}
            </motion.div>

            {/* Stats Row */}
            <motion.div
                className="ud-stats-row"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div
                    className={`ud-stat-card clickable ${showCourses ? 'active' : ''}`}
                    onClick={handleToggleCourses}
                    title={user?.role?.toUpperCase() === 'INSTRUCTOR' ? "Click to view created courses" : "Click to view enrolled courses"}
                >
                    <BookOpen size={20} className="ud-stat-icon enrollments" />
                    <div>
                        <span className="ud-stat-value">{user?.role?.toUpperCase() === 'INSTRUCTOR' ? (user.courseCount ?? 0) : (user.enrollmentCount ?? 0)}</span>
                        <span className="ud-stat-label">{user?.role?.toUpperCase() === 'INSTRUCTOR' ? 'Courses' : 'Enrollments'}</span>
                    </div>
                    <ChevronDown size={16} className={`ud-stat-chevron ${showCourses ? 'open' : ''}`} />
                </div>

                <div className="ud-stat-card">
                    <Wallet size={20} className="ud-stat-icon balance" />
                    <div>
                        <span className="ud-stat-value">
                            ${parseFloat(user.systemBalance || 0).toLocaleString()}
                        </span>
                        <span className="ud-stat-label">Balance</span>
                    </div>
                </div>

                <div className="ud-stat-card">
                    <Shield size={20} className="ud-stat-icon role" />
                    <div>
                        <span className="ud-stat-value">{user.role}</span>
                        <span className="ud-stat-label">Role</span>
                    </div>
                </div>

                <div className="ud-stat-card">
                    <LogIn size={20} className="ud-stat-icon provider" />
                    <div>
                        <span className="ud-stat-value">{user.loginProvider || 'Email'}</span>
                        <span className="ud-stat-label">Login via</span>
                    </div>
                </div>
            </motion.div>

            {/* Courses / Enrollments Section */}
            {showCourses && (
                <motion.div
                    className="ud-courses-section"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="ud-courses-header">
                        <BookOpen size={18} className="ud-tx-icon" />
                        <h3 className="ud-card-title" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
                            {user?.role?.toUpperCase() === 'INSTRUCTOR' ? 'Courses Created' : 'Enrolled Courses'}
                        </h3>
                        <span className="ud-tx-count">{courses.length} course{courses.length !== 1 ? 's' : ''}</span>
                    </div>

                    {coursesLoading ? (
                        <div className="ud-tx-loading">
                            <div className="ud-spinner" />
                            <span>Loading courses...</span>
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="ud-tx-empty">
                            <BookOpen size={32} />
                            <p>{user?.role?.toUpperCase() === 'INSTRUCTOR' ? 'No courses created yet' : 'Not enrolled in any courses yet'}</p>
                        </div>
                    ) : (
                        <div className="ud-courses-grid">
                            {courses.map(course => (
                                <div
                                    key={course.id}
                                    className="ud-course-card"
                                    onClick={() => navigate(`/admin/courses`)}
                                >
                                    <div className="ud-course-thumb">
                                        {course.thumbnail ? (
                                            <img src={course.thumbnail} alt={course.title} />
                                        ) : (
                                            <div className="ud-course-thumb-placeholder">
                                                <BookOpen size={24} />
                                            </div>
                                        )}
                                        <span className={`ud-course-status ${(course.approvalStatus || course.status).toLowerCase()}`}>
                                            {course.approvalStatus || course.status}
                                        </span>
                                    </div>
                                    <div className="ud-course-info">
                                        <h4 className="ud-course-title">{course.title}</h4>
                                        <div className="ud-course-meta">
                                            <span className="ud-course-category">{course.category}</span>
                                            <span className="ud-course-learners">
                                                <Users size={12} /> {course.learnerCount}
                                            </span>
                                            <span className="ud-course-price">
                                                {course.price > 0 ? `${course.price}` : 'Free'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Details Grid */}
            <motion.div
                className="ud-details-grid"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
            >
                {/* Contact Info */}
                <div className="ud-card">
                    <h3 className="ud-card-title">Contact Information</h3>
                    <div className="ud-info-list">
                        <InfoRow icon={<Mail size={15} />} label="Email" value={user.email} />
                        <InfoRow icon={<Phone size={15} />} label="Phone" value={user.phone || '—'} />
                        <InfoRow icon={<AtSign size={15} />} label="Username" value={`@${user.userName}`} />
                        <InfoRow icon={<User size={15} />} label="User ID" value={user.id} mono />
                    </div>
                </div>

                {/* Account Info */}
                <div className="ud-card">
                    <h3 className="ud-card-title">Account Details</h3>
                    <div className="ud-info-list">
                        <InfoRow
                            icon={<Calendar size={15} />}
                            label="Joined"
                            value={formatDate(user.createdAt)}
                        />
                        <InfoRow
                            icon={<Clock size={15} />}
                            label="Last Active"
                            value={formatDate(user.lastLogin)}
                        />
                        <InfoRow
                            icon={<Cake size={15} />}
                            label="Date of Birth"
                            value={user.dateOfBirth ? formatDate(user.dateOfBirth) : '—'}
                        />
                        <InfoRow
                            icon={<BadgeCheck size={15} />}
                            label="Email Verified"
                            value={user.isVerified ? 'Yes' : 'No'}
                            highlight={user.isVerified ? 'success' : 'muted'}
                        />
                    </div>
                </div>

                {/* Bio */}
                {user.bio && (
                    <div className="ud-card ud-card-full">
                        <h3 className="ud-card-title">Bio</h3>
                        <p className="ud-bio-text">{user.bio}</p>
                    </div>
                )}
            </motion.div>

            {/* Transaction History */}
            <motion.div
                className="ud-tx-section"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26 }}
            >
                <div className="ud-tx-header">
                    <div className="ud-tx-title-row">
                        <Receipt size={18} className="ud-tx-icon" />
                        <h3 className="ud-card-title" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
                            {isSalesHistory ? 'Sales History' : 'Transaction History'}
                        </h3>
                    </div>
                    {txPagination && (
                        <span className="ud-tx-count">
                            {txPagination.totalItems} {isSalesHistory ? 'sale' : 'transaction'}{txPagination.totalItems !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {txLoading ? (
                    <div className="ud-tx-loading">
                        <div className="ud-spinner" />
                        <span>Loading transactions...</span>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="ud-tx-empty">
                        <Receipt size={32} />
                        <p>No transactions found</p>
                    </div>
                ) : (
                    <>
                        <div className="ud-tx-table-wrap">
                            <table className="ud-tx-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Courses</th>
                                        <th>Amount</th>
                                        <th>Discount</th>
                                        <th>{isSalesHistory ? 'Learner' : 'Gateway'}</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx) => (
                                        <tr key={tx.id}>
                                            <td className="ud-tx-date">
                                                {formatDate(tx.createdAt)}
                                            </td>
                                            <td className="ud-tx-courses">
                                                {tx.courses.length > 0 ? (
                                                    tx.courses.map((c) => (
                                                        <span key={c.id} className="ud-tx-course-tag">
                                                            {c.title}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="ud-tx-no-course">—</span>
                                                )}
                                            </td>
                                            <td className="ud-tx-amount">
                                                {formatCurrency(tx.amount)}
                                            </td>
                                            <td className="ud-tx-discount">
                                                {tx.discountAmount > 0 ? (
                                                    <span className="ud-tx-discount-val">
                                                        -{formatCurrency(tx.discountAmount)}
                                                        {tx.couponCode && (
                                                            <span className="ud-tx-coupon">{tx.couponCode}</span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td>
                                                <span className="ud-tx-gateway">
                                                    {isSalesHistory ? tx.buyerName : tx.gateway}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`ud-tx-status ${tx.isSuccessful ? 'success' : 'failed'}`}>
                                                    {tx.isSuccessful ? (
                                                        <><CheckCircle2 size={12} /> Success</>
                                                    ) : (
                                                        <><AlertCircle size={12} /> Failed</>
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {txPagination && txPagination.totalPages > 1 && (
                            <div className="ud-tx-pagination">
                                <button
                                    className="ud-tx-page-btn"
                                    disabled={!txPagination.hasPrevPage}
                                    onClick={() => setTxPage((p) => p - 1)}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="ud-tx-page-info">
                                    Page {txPagination.currentPage} of {txPagination.totalPages}
                                </span>
                                <button
                                    className="ud-tx-page-btn"
                                    disabled={!txPagination.hasNextPage}
                                    onClick={() => setTxPage((p) => p + 1)}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
            {/* Custom Lock Modal */}
            {isLockModalOpen && (
                <div className="ud-modal-overlay" onClick={() => setIsLockModalOpen(false)}>
                    <motion.div 
                        className="ud-modal-content"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="ud-modal-header">
                            <Lock className="ud-modal-icon" size={24} />
                            <h3>Lock Account</h3>
                        </div>
                        <div className="ud-modal-body">
                            <p>Are you sure you want to suspend <strong>{user?.fullName}</strong>? Locked users cannot access the platform until reactivated.</p>
                            <label className="ud-modal-label">Reason for Suspension</label>
                            <textarea
                                className="ud-modal-textarea"
                                placeholder="e.g. Violation of Community Guidelines, Fraudulent Activity..."
                                value={lockReason}
                                onChange={(e) => setLockReason(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="ud-modal-footer">
                            <button 
                                className="ud-modal-btn ud-modal-btn-cancel"
                                onClick={() => setIsLockModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="ud-modal-btn ud-modal-btn-confirm"
                                onClick={confirmLock}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Processing...' : 'Confirm Lock'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

        </div>
    );
}

function InfoRow({ icon, label, value, mono = false, highlight }) {
    return (
        <div className="ud-info-row">
            <span className="ud-info-icon">{icon}</span>
            <span className="ud-info-label">{label}</span>
            <span
                className={`ud-info-value ${mono ? 'mono' : ''} ${highlight ? `highlight-${highlight}` : ''}`}
            >
                {value}
            </span>
        </div>
    );
}

export default UserDetail;

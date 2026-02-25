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
} from 'lucide-react';

import userService from '../../services/userService';
import { formatDate } from '../../utils/formatters';
import './UserDetail.css';

function UserDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null);

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

    useEffect(() => {
        fetchUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleLock = async () => {
        try {
            setActionLoading(true);
            await userService.lockUser(id);
            showToast('User locked successfully');
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
                <button className="ud-btn ud-btn-primary" onClick={() => navigate('/users')}>
                    <ArrowLeft size={16} /> Back to Users
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
                onClick={() => navigate('/users')}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <ArrowLeft size={16} />
                Back to Users
            </motion.button>

            {/* Hero Section */}
            <motion.div
                className="ud-hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <div className="ud-hero-bg" />

                <div className="ud-hero-content">
                    <div className="ud-avatar-wrap">
                        <img src={user.avatar} alt={user.fullName} className="ud-avatar" />
                        <span className={`ud-avatar-status ${isActive ? 'active' : 'locked'}`} />
                    </div>

                    <div className="ud-hero-info">
                        <div className="ud-name-row">
                            <h1 className="ud-name">{user.fullName}</h1>
                            {user.isVerified && (
                                <span className="ud-verified-badge" title="Verified">
                                    <BadgeCheck size={20} />
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

                    {/* Action Buttons */}
                    {!isAdmin && (
                        <div className="ud-hero-actions">
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
                </div>
            </motion.div>

            {/* Stats Row */}
            <motion.div
                className="ud-stats-row"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="ud-stat-card">
                    <BookOpen size={20} className="ud-stat-icon enrollments" />
                    <div>
                        <span className="ud-stat-value">{user.enrollmentCount ?? 0}</span>
                        <span className="ud-stat-label">Enrollments</span>
                    </div>
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

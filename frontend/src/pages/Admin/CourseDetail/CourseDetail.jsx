import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    Archive,
    Clock,
    Users,
    Star,
    PlayCircle,
    DollarSign,
    BookOpen,
    Calendar,
    ChevronDown,
    ChevronRight,
    Mail,
    User,
    Tag,
    BarChart3,
    AlertCircle,
    CheckCircle2,
    Target,
    ListChecks,
    FileText,
} from 'lucide-react';

import courseService from '../../../services/admin/courseService';
import './CourseDetail.css';

/**
 * Format a date string for display
 */
const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

/**
 * Format price as currency
 */
const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(price || 0);
};

function CourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchCourse = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const result = await courseService.getCourseById(id);
            setCourse(result);
        } catch (err) {
            setError(err.message || 'Failed to load course');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourse();
    }, [id]);

    // Actions
    const handleApprove = async () => {
        try {
            setActionLoading(true);
            await courseService.approveCourse(id);
            showToast('Course approved successfully');
            await fetchCourse();
        } catch (err) {
            showToast(err.message || 'Failed to approve course', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        const reason = prompt('Enter rejection reason:');
        if (reason === null) return; // cancelled
        try {
            setActionLoading(true);
            await courseService.rejectCourse(id, reason || 'Content does not meet quality standards');
            showToast('Course rejected');
            await fetchCourse();
        } catch (err) {
            showToast(err.message || 'Failed to reject course', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleArchive = async () => {
        if (!confirm('Are you sure you want to archive this course?')) return;
        try {
            setActionLoading(true);
            await courseService.archiveCourse(id);
            showToast('Course archived successfully');
            await fetchCourse();
        } catch (err) {
            showToast(err.message || 'Failed to archive course', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }));
    };

    // Status helpers
    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING': return <Clock size={14} />;
            case 'APPROVED': return <CheckCircle size={14} />;
            case 'REJECTED': return <XCircle size={14} />;
            case 'ARCHIVED': return <Archive size={14} />;
            default: return null;
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="cd-loading-screen">
                <div className="cd-spinner" />
                <span>Loading course details...</span>
            </div>
        );
    }

    // Error state
    if (error || !course) {
        return (
            <div className="cd-error-screen">
                <AlertCircle size={48} />
                <h2>Course not found</h2>
                <p>{error || 'The requested course does not exist.'}</p>
                <button className="cd-btn cd-btn-primary" onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} /> Go Back
                </button>
            </div>
        );
    }

    const rating = course.ratingCount > 0
        ? (course.rating || 0)
        : 0;

    return (
        <div className="cd-page">
            {/* Toast */}
            {toast && (
                <motion.div
                    className={`cd-toast ${toast.type}`}
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
                className="cd-back-btn"
                onClick={() => navigate(-1)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <ArrowLeft size={16} />
                Back to Courses
            </motion.button>

            {/* Hero Header */}
            <motion.div
                className="cd-hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <div className="cd-hero-thumbnail">
                    <img
                        src={course.thumbnail || 'https://placehold.co/400x225?text=No+Image'}
                        alt={course.title}
                    />
                </div>
                <div className="cd-hero-content">
                    <div className="cd-hero-top">
                        <div className="cd-badges-row">
                            <span className={`cd-status-badge ${course.status.toLowerCase()}`}>
                                {getStatusIcon(course.status)}
                                {course.status}
                            </span>
                            {course.category && (
                                <span className="cd-category-badge">
                                    <Tag size={11} />
                                    {course.category}
                                </span>
                            )}
                            {course.level && (
                                <span className="cd-level-badge">
                                    <BarChart3 size={11} />
                                    {course.level}
                                </span>
                            )}
                        </div>
                    </div>

                    <h1 className="cd-title">{course.title}</h1>

                    {course.intro && (
                        <p className="cd-intro">{course.intro}</p>
                    )}

                    {/* Action Buttons */}
                    <div className="cd-hero-actions">
                        {(course.status === 'PENDING' || course.status === 'REJECTED') && (
                            <button
                                className="cd-btn cd-btn-success"
                                onClick={handleApprove}
                                disabled={actionLoading}
                            >
                                <CheckCircle size={15} />
                                {actionLoading ? 'Approving...' : 'Approve'}
                            </button>
                        )}
                        {course.status === 'PENDING' && (
                            <button
                                className="cd-btn cd-btn-danger"
                                onClick={handleReject}
                                disabled={actionLoading}
                            >
                                <XCircle size={15} />
                                {actionLoading ? 'Rejecting...' : 'Reject'}
                            </button>
                        )}
                        {course.status === 'APPROVED' && (
                            <button
                                className="cd-btn cd-btn-warning"
                                onClick={handleArchive}
                                disabled={actionLoading}
                            >
                                <Archive size={15} />
                                {actionLoading ? 'Archiving...' : 'Archive'}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Rejection Reason */}
            {course.status === 'REJECTED' && course.rejectReason && (
                <motion.div
                    className="cd-reject-banner"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <XCircle size={18} />
                    <div>
                        <strong>Rejection Reason</strong>
                        <p>{course.rejectReason}</p>
                    </div>
                </motion.div>
            )}

            {/* Stats Row */}
            <motion.div
                className="cd-stats-row"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="cd-stat-card">
                    <Users size={20} className="cd-stat-icon students" />
                    <div>
                        <span className="cd-stat-value">{course.enrolledCount ?? 0}</span>
                        <span className="cd-stat-label">Students</span>
                    </div>
                </div>
                <div className="cd-stat-card">
                    <PlayCircle size={20} className="cd-stat-icon lessons" />
                    <div>
                        <span className="cd-stat-value">{course.totalLessons ?? 0}</span>
                        <span className="cd-stat-label">Lessons</span>
                    </div>
                </div>
                <div className="cd-stat-card">
                    <DollarSign size={20} className="cd-stat-icon price" />
                    <div>
                        <span className="cd-stat-value">{formatPrice(course.price)}</span>
                        <span className="cd-stat-label">
                            {course.discount > 0 ? (
                                <s style={{ opacity: 0.5, marginRight: 4 }}>{formatPrice(course.discount)}</s>
                            ) : null}
                            Price
                        </span>
                    </div>
                </div>
                <div className="cd-stat-card">
                    <Star size={20} className="cd-stat-icon rating" />
                    <div>
                        <span className="cd-stat-value">
                            {rating > 0 ? rating : '—'}
                            {rating > 0 && <span className="cd-rating-suffix">/5</span>}
                        </span>
                        <span className="cd-stat-label">{course.ratingCount ?? 0} Reviews</span>
                    </div>
                </div>
            </motion.div>

            {/* Main Content Grid */}
            <motion.div
                className="cd-content-grid"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
            >
                {/* Left Column */}
                <div className="cd-content-left">
                    {/* Description */}
                    {course.description && (
                        <div className="cd-card">
                            <h3 className="cd-card-title">
                                <FileText size={15} /> Description
                            </h3>
                            <div className="cd-description-text">
                                {course.description}
                            </div>
                        </div>
                    )}

                    {/* Outcomes */}
                    {course.outcomes && (
                        <div className="cd-card">
                            <h3 className="cd-card-title">
                                <Target size={15} /> Learning Outcomes
                            </h3>
                            <div className="cd-outcomes-text">
                                {course.outcomes}
                            </div>
                        </div>
                    )}

                    {/* Requirements */}
                    {course.requirements && (
                        <div className="cd-card">
                            <h3 className="cd-card-title">
                                <ListChecks size={15} /> Requirements
                            </h3>
                            <div className="cd-requirements-text">
                                {course.requirements}
                            </div>
                        </div>
                    )}

                    {/* Curriculum */}
                    {course.sections && course.sections.length > 0 && (
                        <div className="cd-card">
                            <h3 className="cd-card-title">
                                <BookOpen size={15} /> Curriculum
                                <span className="cd-curriculum-count">
                                    {course.sections.length} sections • {course.totalLessons} lessons
                                </span>
                            </h3>
                            <div className="cd-curriculum">
                                {course.sections.map((section, idx) => (
                                    <div key={section.id} className="cd-section-item">
                                        <button
                                            className={`cd-section-header ${expandedSections[section.id] ? 'expanded' : ''}`}
                                            onClick={() => toggleSection(section.id)}
                                        >
                                            <span className="cd-section-toggle">
                                                {expandedSections[section.id]
                                                    ? <ChevronDown size={16} />
                                                    : <ChevronRight size={16} />
                                                }
                                            </span>
                                            <span className="cd-section-title">
                                                Section {idx + 1}: {section.title}
                                            </span>
                                            <span className="cd-section-count">
                                                {section.lectures?.length || 0} lectures
                                            </span>
                                        </button>
                                        {expandedSections[section.id] && section.lectures && (
                                            <div className="cd-lectures-list">
                                                {section.lectures.map((lecture, lIdx) => (
                                                    <div key={lecture.id} className="cd-lecture-item">
                                                        <PlayCircle size={13} />
                                                        <span className="cd-lecture-num">{lIdx + 1}.</span>
                                                        <span>{lecture.title}</span>
                                                    </div>
                                                ))}
                                                {section.lectures.length === 0 && (
                                                    <div className="cd-lecture-empty">No lectures in this section</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Sidebar */}
                <div className="cd-content-right">
                    {/* Instructor Card */}
                    {course.instructor && (
                        <div className="cd-card cd-instructor-card">
                            <h3 className="cd-card-title">Instructor</h3>
                            <div className="cd-instructor-info">
                                <img
                                    src={course.instructor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor.name || 'Unknown')}&background=a855f7&color=fff`}
                                    alt={course.instructor.name}
                                    className="cd-instructor-avatar"
                                />
                                <div className="cd-instructor-details">
                                    <span className="cd-instructor-name">{course.instructor.name || 'Unknown'}</span>
                                    {course.instructor.email && (
                                        <span className="cd-instructor-email">
                                            <Mail size={12} />
                                            {course.instructor.email}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Course Metadata */}
                    <div className="cd-card">
                        <h3 className="cd-card-title">Course Details</h3>
                        <div className="cd-meta-list">
                            <InfoRow icon={<Tag size={14} />} label="Category" value={course.category || '—'} />
                            <InfoRow icon={<BarChart3 size={14} />} label="Level" value={course.level || '—'} />
                            <InfoRow icon={<DollarSign size={14} />} label="Price" value={formatPrice(course.price)} />
                            {course.discount > 0 && (
                                <InfoRow icon={<DollarSign size={14} />} label="Discount" value={formatPrice(course.discount)} />
                            )}
                            <InfoRow icon={<Calendar size={14} />} label="Created" value={formatDate(course.createdAt)} />
                            <InfoRow icon={<Clock size={14} />} label="Updated" value={formatDate(course.updatedAt)} />
                            <InfoRow icon={<User size={14} />} label="Course ID" value={course.id} mono />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function InfoRow({ icon, label, value, mono = false }) {
    return (
        <div className="cd-meta-row">
            <span className="cd-meta-icon">{icon}</span>
            <span className="cd-meta-label">{label}</span>
            <span className={`cd-meta-value ${mono ? 'mono' : ''}`}>{value}</span>
        </div>
    );
}

export default CourseDetail;

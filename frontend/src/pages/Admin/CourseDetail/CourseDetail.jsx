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
    RotateCcw,
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
    const [showStudents, setShowStudents] = useState(false);
    const [students, setStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [archiveReason, setArchiveReason] = useState('');

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

    const handleReject = () => {
        setRejectReason('');
        setIsRejectModalOpen(true);
    };

    const confirmReject = async () => {
        try {
            setActionLoading(true);
            await courseService.rejectCourse(id, rejectReason || 'Content does not meet quality standards');
            showToast('Course rejected');
            setIsRejectModalOpen(false);
            await fetchCourse();
        } catch (err) {
            showToast(err.message || 'Failed to reject course', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleArchive = () => {
        setIsArchiveModalOpen(true);
    };

    const confirmArchive = async () => {
        try {
            setActionLoading(true);
            await courseService.archiveCourse(id, archiveReason || 'Course content is no longer required or has been replaced.');
            showToast('Course archived successfully');
            setIsArchiveModalOpen(false);
            setArchiveReason('');
            await fetchCourse();
        } catch (err) {
            showToast(err.message || 'Failed to archive course', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnarchive = async () => {
        try {
            setActionLoading(true);
            await courseService.unarchiveCourse(id);
            showToast('Course unarchived successfully');
            await fetchCourse();
        } catch (err) {
            showToast(err.message || 'Failed to unarchive course', 'error');
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

    const handleShowStudents = async () => {
        setShowStudents(true);
        setStudentsLoading(true);
        try {
            const result = await courseService.getCourseStudents(id);
            setStudents(result.students || []);
        } catch (err) {
            showToast('Failed to load students', 'error');
        } finally {
            setStudentsLoading(false);
        }
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
                        {course.status === 'ARCHIVED' && (
                            <button
                                className="cd-btn cd-btn-success"
                                onClick={handleUnarchive}
                                disabled={actionLoading}
                            >
                                <RotateCcw size={15} />
                                {actionLoading ? 'Unarchiving...' : 'Unarchive'}
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

            {course.status === 'ARCHIVED' && course.archiveReason && (
                <motion.div
                    className="cd-archive-banner"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Archive size={18} />
                    <div>
                        <strong>Archive Reason</strong>
                        <p>{course.archiveReason}</p>
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
                <div className="cd-stat-card" onClick={handleShowStudents} style={{ cursor: 'pointer', transition: 'transform 0.15s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <Users size={20} className="cd-stat-icon students" />
                    <div>
                        <span className="cd-stat-value">{course.enrolledCount ?? 0}</span>
                        <span className="cd-stat-label">Students ▸</span>
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

                    {/* Archive Reason Sidebar Card */}
                    {course.status === 'ARCHIVED' && (
                        <div className="cd-card cd-reason-card archive">
                            <h3 className="cd-card-title">
                                <Archive size={15} /> Archive Reason
                                <button 
                                    className="cd-reason-edit-btn" 
                                    onClick={() => setIsArchiveModalOpen(true)}
                                    title="Edit Reason"
                                >
                                    Edit
                                </button>
                            </h3>
                            <div className="cd-reason-text">
                                {course.archiveReason || 'No reason provided for this archived course.'}
                            </div>
                        </div>
                    )}
                    
                    {/* Rejection Reason Sidebar Card (Optional addition for consistency) */}
                    {course.status === 'REJECTED' && (
                        <div className="cd-card cd-reason-card reject">
                            <h3 className="cd-card-title">
                                <XCircle size={15} /> Rejection Reason
                                <button 
                                    className="cd-reason-edit-btn" 
                                    onClick={() => setIsRejectModalOpen(true)}
                                    title="Edit Reason"
                                >
                                    Edit
                                </button>
                            </h3>
                            <div className="cd-reason-text">
                                {course.rejectReason || 'No reason provided for this rejection.'}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Students Modal */}
            {showStudents && (
                <motion.div
                    className="cd-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowStudents(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        onClick={e => e.stopPropagation()}
                        style={{ background: '#1a1a2e', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.2)', padding: '24px', width: '90%', maxWidth: '600px', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ color: '#fff', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users size={18} /> Enrolled Students ({students.length})
                            </h3>
                            <button onClick={() => setShowStudents(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '20px', padding: '4px' }}>&times;</button>
                        </div>

                        <div className="custom-scrollbar" style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
                            {studentsLoading ? (
                                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>Loading students...</div>
                            ) : students.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>No students enrolled yet.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {students.map((student, idx) => (
                                        <div key={student.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <img
                                                src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=a855f7&color=fff&size=36`}
                                                alt={student.name}
                                                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>{student.name}</div>
                                                <div style={{ color: '#9ca3af', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.email}</div>
                                            </div>
                                            <div style={{ color: '#6b7280', fontSize: '11px', whiteSpace: 'nowrap' }}>
                                                {formatDate(student.enrolledAt)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Rejection Modal */}
            {isRejectModalOpen && (
                <div className="cd-modal-overlay" onClick={() => setIsRejectModalOpen(false)}>
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
                            <p>Are you sure you want to reject <strong>{course?.title}</strong>? This will notify the instructor to make necessary changes.</p>
                            <label className="cd-modal-label">Reason for Rejection</label>
                            <textarea
                                className="cd-modal-textarea"
                                placeholder="e.g. Quality standards not met, missing resources, incorrect category..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="cd-modal-footer">
                            <button 
                                className="cd-modal-btn cd-modal-btn-cancel"
                                onClick={() => setIsRejectModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="cd-modal-btn cd-modal-btn-confirm"
                                onClick={confirmReject}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Processing...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
            {/* Archive Modal */}
            {isArchiveModalOpen && (
                <div className="cd-modal-overlay">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="cd-modal-content"
                        style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}
                    >
                        <div className="cd-modal-header">
                            <Archive size={24} className="cd-modal-icon" style={{ color: '#f59e0b' }} />
                            <h3>Archive Course</h3>
                        </div>
                        <div className="cd-modal-body">
                            <p>Are you sure you want to archive <strong>{course?.Title}</strong>? This will hide the course from the public listing.</p>
                            <label className="cd-modal-label">Reason for Archiving (Optional)</label>
                            <textarea
                                className="cd-modal-textarea"
                                value={archiveReason}
                                onChange={(e) => setArchiveReason(e.target.value)}
                                placeholder="Provide a reason for the instructor..."
                                spellCheck="false"
                            />
                        </div>
                        <div className="cd-modal-footer">
                            <button
                                className="cd-modal-btn cd-modal-btn-cancel"
                                onClick={() => {
                                    setIsArchiveModalOpen(false);
                                    setArchiveReason('');
                                }}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="cd-modal-btn cd-modal-btn-confirm"
                                style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
                                onClick={confirmArchive}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
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

const fs = require('fs');

// Patch CourseDetail.jsx
const cdPath = 'd:/KHOA_FPT/SPRING26/SWP391/FlyUpProject/frontend/src/pages/Admin/CourseDetail/CourseDetail.jsx';
let cd = fs.readFileSync(cdPath, 'utf8');

if (!cd.includes('isRejectModalOpen &&')) {
    const modalJSX = `
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
`;
    // Find the last </div> before the end of the component
    const lastD = cd.lastIndexOf('        </div>\n    );');
    if (lastD !== -1) {
        cd = cd.substring(0, lastD) + modalJSX + cd.substring(lastD);
        fs.writeFileSync(cdPath, cd, 'utf8');
        console.log('Patched CourseDetail.jsx');
    } else {
        console.log('Could not find insertion point in CourseDetail.jsx');
    }
}

// Patch Courses.jsx
const csPath = 'd:/KHOA_FPT/SPRING26/SWP391/FlyUpProject/frontend/src/pages/Admin/Courses/Courses.jsx';
let cs = fs.readFileSync(csPath, 'utf8');

if (!cs.includes('isRejectModalOpen &&')) {
    const modalJSX = `
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
                            <p>Are you sure you want to reject <strong>{courseToReject?.title}</strong>? This will notify the instructor.</p>
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
                                disabled={actionLoading === courseToReject?.id}
                            >
                                {actionLoading === courseToReject?.id ? 'Processing...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
`;
    const lastD = cs.lastIndexOf('        </div>\n    );');
    if (lastD !== -1) {
        cs = cs.substring(0, lastD) + modalJSX + cs.substring(lastD);
        fs.writeFileSync(csPath, cs, 'utf8');
        console.log('Patched Courses.jsx');
    } else {
        console.log('Could not find insertion point in Courses.jsx');
    }
}

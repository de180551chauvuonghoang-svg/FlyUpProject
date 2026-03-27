const fs = require('fs');

const modalJSXDetail = `
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

const modalJSXCourses = `
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

const patch = (filePath, jsx) => {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('isRejectModalOpen &&')) {
        console.log('Already patched: ' + filePath);
        return;
    }
    
    // Using a more robust way to find the last </div> before the end of the return statement
    // We look for the pattern </div> followed by ); and then }
    const parts = content.split(/<\/div>\s+\);\s+\}/);
    if (parts.length > 1) {
        const lastPart = content.substring(content.lastIndexOf(parts[parts.length-2]) + parts[parts.length-2].length);
        const match = lastPart.match(/<\/div>\s+\);\s+\}/);
        if (match) {
            const insertPos = content.lastIndexOf(match[0]);
            const newContent = content.substring(0, insertPos) + jsx + content.substring(insertPos);
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Successfully patched: ' + filePath);
        } else {
             // Try a simpler replace if that failed
             const simpleMatch = content.lastIndexOf('        </div>\n    );');
             if (simpleMatch !== -1) {
                const newContent = content.substring(0, simpleMatch) + jsx + content.substring(simpleMatch);
                fs.writeFileSync(filePath, newContent, 'utf8');
                console.log('Successfully patched (simple): ' + filePath);
             } else {
                // Try CRLF
                const simpleMatchCRLF = content.lastIndexOf('        </div>\r\n    );');
                if (simpleMatchCRLF !== -1) {
                    const newContent = content.substring(0, simpleMatchCRLF) + jsx + content.substring(simpleMatchCRLF);
                    fs.writeFileSync(filePath, newContent, 'utf8');
                    console.log('Successfully patched (CRLF): ' + filePath);
                } else {
                    console.log('Failed to patch: ' + filePath);
                }
             }
        }
    } else {
        console.log('Could not split file: ' + filePath);
    }
};

patch('d:/KHOA_FPT/SPRING26/SWP391/FlyUpProject/frontend/src/pages/Admin/CourseDetail/CourseDetail.jsx', modalJSXDetail);
patch('d:/KHOA_FPT/SPRING26/SWP391/FlyUpProject/frontend/src/pages/Admin/Courses/Courses.jsx', modalJSXCourses);

const fs = require('fs');

// Fix CourseDetail.jsx
const cdPath = 'd:/KHOA_FPT/SPRING26/SWP391/FlyUpProject/frontend/src/pages/Admin/CourseDetail/CourseDetail.jsx';
let cd = fs.readFileSync(cdPath, 'utf8');

// 1. Remove the misplaced modal from InfoRow
const misplaced = `
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
            )}`;

cd = cd.replace(misplaced, '');

// 2. Insert it before the correct </div> in CourseDetail's return
// The correct </div> is before the InfoRow definition.
const searchStr = '            )}\n        </div>\n    );\n}';
const correctJSX = misplaced + '\n        </div>\n    );';

if (cd.includes('            )}\n        </div>\n    );\n}')) {
    cd = cd.replace('            )}\n        </div>\n    );\n}', '            )}' + misplaced + '\n        </div>\n    );\n}');
    fs.writeFileSync(cdPath, cd, 'utf8');
    console.log('Fixed CourseDetail.jsx');
} else {
    // Try with CRLF
    if (cd.includes('            )}\r\n        </div>\r\n    );\r\n}')) {
        cd = cd.replace('            )}\r\n        </div>\r\n    );\r\n}', '            )}' + misplaced + '\r\n        </div>\r\n    );\r\n}');
        fs.writeFileSync(cdPath, cd, 'utf8');
        console.log('Fixed CourseDetail.jsx (CRLF)');
    } else {
        console.log('Could not find correct insertion point in CourseDetail.jsx');
    }
}

// Check Courses.jsx
const csPath = 'd:/KHOA_FPT/SPRING26/SWP391/FlyUpProject/frontend/src/pages/Admin/Courses/Courses.jsx';
let cs = fs.readFileSync(csPath, 'utf8');
// For Courses.jsx, InfoRow is NOT there, so the last ); } should be correct.
// But let's verify where it was inserted.
if (cs.includes('isRejectModalOpen &&')) {
    console.log('Courses.jsx already has the modal. Verifying position...');
    // In Courses.jsx, it should be before the last </div> of .courses-page
    // Let's just make sure it's not at the very end of file.
}

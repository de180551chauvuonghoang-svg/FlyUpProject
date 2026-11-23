const fs = require('fs');
const path = require('path');

const jsxPath = 'd:/KHOA_FPT/SPRING26/SWP391/FlyUpProject/frontend/src/pages/Admin/UserDetail/UserDetail.jsx';
const cssPath = 'd:/KHOA_FPT/SPRING26/SWP391/FlyUpProject/frontend/src/pages/Admin/UserDetail/UserDetail.css';

// 1. Patch CSS
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('.ud-modal-overlay')) {
    css += `
/* ─── Custom Lock Modal ────────────────────────────── */
.ud-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.ud-modal-content {
  background: var(--bg-card, #1e293b);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 20px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  position: relative;
}

.ud-modal-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ef4444, #b91c1c);
}

.ud-modal-header {
  padding: 24px 24px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.ud-modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary, #f1f5f9);
}

.ud-modal-icon {
  color: #ef4444;
}

.ud-modal-body {
  padding: 0 24px 24px;
}

.ud-modal-body p {
  font-size: 0.9rem;
  color: var(--text-secondary, #94a3b8);
  margin-bottom: 20px;
  line-height: 1.5;
}

.ud-modal-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary, #94a3b8);
  margin-bottom: 8px;
}

.ud-modal-textarea {
  width: 100%;
  min-height: 120px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  color: #f1f5f9;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;
}

.ud-modal-textarea:focus {
  outline: none;
  border-color: #ef4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
  background: rgba(15, 23, 42, 0.8);
}

.ud-modal-footer {
  padding: 16px 24px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: rgba(15, 23, 42, 0.3);
}

.ud-modal-btn {
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.ud-modal-btn-cancel {
  background: transparent;
  color: var(--text-secondary, #94a3b8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.ud-modal-btn-cancel:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #f1f5f9;
}

.ud-modal-btn-confirm {
  background: #ef4444;
  color: white;
  border: 1px solid #ef4444;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ud-modal-btn-confirm:hover {
  background: #dc2626;
  border-color: #dc2626;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.ud-modal-btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;
    fs.writeFileSync(cssPath, css, 'utf8');
}

// 2. Patch JSX
let jsx = fs.readFileSync(jsxPath, 'utf8');

// Add states
if (!jsx.includes('isLockModalOpen')) {
    jsx = jsx.replace(
        'const [coursesLoading, setCoursesLoading] = useState(false);',
        'const [coursesLoading, setCoursesLoading] = useState(false);\n    const [isLockModalOpen, setIsLockModalOpen] = useState(false);\n    const [lockReason, setLockReason] = useState(\'\');'
    );
}

// Update handleLock, add confirmLock
const oldHandleLock = `    const handleLock = async () => {
        const reason = window.prompt('Enter reason for locking this user account:');
        if (reason === null) return; // Action cancelled
        try {
            setActionLoading(true);
            await userService.lockUser(id, reason || 'Violation of terms of service');
            showToast('User locked successfully');
            await fetchUser();
        } catch (err) {
            showToast(err.message || 'Failed to lock user', 'error');
        } finally {
            setActionLoading(false);
        }
    };`;

const newHandleLock = `    const handleLock = () => {
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
    };`;

if (jsx.includes('window.prompt(\'Enter reason for locking this user account:\')')) {
    // Exact match failed due to whitespace/newlines, use a more flexible replace
    jsx = jsx.replace(/const handleLock = async \(\) => \{(?:.|\n)+?setActionLoading\(false\);\n\s+\};\s+?\}/, newHandleLock + '\n    }');
} else {
   // Fallback if previous patch was different or failed
}

// Add Modal JSX
const modalJSX = `
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
`;

if (!jsx.includes('ud-modal-overlay')) {
    jsx = jsx.replace('            </motion.div>\n        </div>\n    );', modalJSX + '            </motion.div>\n        </div>\n    );\n');
}

fs.writeFileSync(jsxPath, jsx, 'utf8');
console.log('Patched CSS and JSX successfully');

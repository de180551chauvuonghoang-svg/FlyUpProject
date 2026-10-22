const fs = require('fs');
const file = 'd:/KHOA_FPT/SPRING26/SWP391/FlyUpProject/frontend/src/pages/Admin/UserDetail/UserDetail.jsx';
let content = fs.readFileSync(file, 'utf8');

console.log('Original length:', content.length);

// 1. Replace handleLock
const handleLockRegex = /const handleLock = async \(\) => \{[\s\S]+?setActionLoading\(false\);\s+\};\s+\}/;
const newHandleLock = `const handleLock = () => {
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

if (handleLockRegex.test(content)) {
    content = content.replace(handleLockRegex, newHandleLock);
    console.log('handleLock patched');
} else {
    console.log('handleLock regex DID NOT match');
}

// 2. Add Modal JSX
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

if (!content.includes('ud-modal-overlay')) {
    const parts = content.split('            </motion.div>');
    if (parts.length > 1) {
        // Find the last one
        const lastIndex = content.lastIndexOf('            </motion.div>');
        content = content.substring(0, lastIndex) + '            </motion.div>' + modalJSX + content.substring(lastIndex + '            </motion.div>'.length);
        console.log('Modal JSX added');
    } else {
        console.log('Split motion.div failed');
    }
} else {
    console.log('Modal JSX already present');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Final patch applied');

const fs = require('fs');
const file = 'd:/KHOA_FPT/SPRING26/SWP391/FlyUpProject/frontend/src/pages/Admin/UserDetail/UserDetail.jsx';
let content = fs.readFileSync(file, 'utf8');

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

const handleLockStart = content.indexOf('const handleLock = async () => {');
const handleUnlockStart = content.indexOf('const handleUnlock = async () => {');

if (handleLockStart !== -1 && handleUnlockStart !== -1) {
    content = content.substring(0, handleLockStart) + newHandleLock + '\n\n    ' + content.substring(handleUnlockStart);
    console.log('handleLock function replaced successfully');
} else {
    console.log('Boundaries handleLockStart or handleUnlockStart not found');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Patch V2 completed');

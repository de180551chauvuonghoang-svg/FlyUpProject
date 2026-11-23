const fs = require('fs');
const file = 'd:/KHOA_FPT/SPRING26/SWP391/FlyUpProject/frontend/src/pages/Admin/UserDetail/UserDetail.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = `    const handleLock = async () => {
        try {
            setActionLoading(true);
            await userService.lockUser(id);`;

const rep = `    const handleLock = async () => {
        const reason = window.prompt('Enter reason for locking this user account:');
        if (reason === null) return; // Action cancelled
        try {
            setActionLoading(true);
            await userService.lockUser(id, reason || 'Violation of terms of service');`;

if (content.indexOf(target) === -1) {
    // try exact match with \r\n
    content = content.replace(/const handleLock = async \(\) => \{\s+try \{\s+setActionLoading\(true\);\s+await userService\.lockUser\(id\);/, rep.trimStart());
} else {
    content = content.replace(target, rep);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Patched correctly');

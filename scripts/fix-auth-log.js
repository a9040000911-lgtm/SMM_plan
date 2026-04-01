const fs = require('fs');
const file = 'src/app/api/admin/auth/route.ts';
let content = fs.readFileSync(file, 'utf8');

// replace systemLog with adminLog
content = content.replace(/prisma\.systemLog\.create/g, 'prisma.adminLog.create');

// Fix the ID reference - adminLog uses adminId instead of userId
content = content.replace(/userId\s*:\s*user\.id,/g, 'adminId: user.id,');
content = content.replace(/userId\s*:\s*bootstrapUser\.id,/g, 'adminId: bootstrapUser.id,');

// remove 'type' field which adminLog doesn't have
content = content.replace(/type\s*:[^,]+,/g, '');

// remove sections where userId: null was saved (log auth failed, but adminLog requires adminId)
content = content.replace(/await\s+prisma\.adminLog\.create\(\{\s*data\s*:\s*\{\s*userId\s*:\s*null,[\s\S]*?\}\s*\}\);/g, '/* Removed missing user log */');
fs.writeFileSync(file, content);
console.log('Done');

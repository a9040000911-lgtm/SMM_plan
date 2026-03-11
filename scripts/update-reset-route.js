const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/app/api/admin/auth/reset-password/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Update import (careful with other imports)
content = content.replace(
    "import { send2FACodeEmail } from '@/services/mail.service';",
    "import { sendPasswordResetEmail } from '@/services/mail.service';"
);

// Update call
content = content.replace(
    "await send2FACodeEmail(normalizedEmail, resetCode);",
    "await sendPasswordResetEmail(normalizedEmail, resetCode);"
);

fs.writeFileSync(filePath, content);
console.log('✅ Success: Updated reset-password route to use sendPasswordResetEmail');

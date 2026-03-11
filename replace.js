const fs = require('fs');
const path = require('path');

function traverse(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('@prisma/client')) {
                let newContent = content.replace(/from\s+['"]@prisma\/client['"]/g, `from '@/generated/client'`);
                if (content !== newContent) {
                    fs.writeFileSync(fullPath, newContent);
                    console.log('Updated:', fullPath);
                }
            }
        }
    });
}

traverse('./src');

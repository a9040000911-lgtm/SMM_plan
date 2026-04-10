const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
    if (!fs.existsSync(dir)) return filelist;
    fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            if (!filepath.includes('node_modules') && !filepath.includes('.next') && !filepath.includes('generated')) {
                filelist = walkSync(filepath, filelist);
            }
        } else {
            if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
                filelist.push(filepath);
            }
        }
    });
    return filelist;
}

const files = walkSync(path.join(process.cwd(), 'src'));
let changesCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // We are looking for: prisma.adminLog.create({ data: { userId: ... , projectId?: ... } })
    // Since regex matching over multiple lines is hard, we can just look for "userId:" near "adminLog.create"
    // Wait, let's just do a naive replace of `userId: ` -> `adminId: ` IF the file has adminLog operations.
    // That's risky. But we can do it using regex to match `prisma.adminLog.create({` block:
    
    // Actually, tsc-errors-new5.log gave exact files and lines!
    const filesWithAdminLogUserId = [
        'src/app/api/client/orders/route.ts',
        'src/services/admin/admin-data.service.ts',
        'src/services/admin/base-admin.service.ts',
        'src/services/admin/log.service.ts',
        'src/services/core/migration.service.ts',
        'src/services/core/self-healing.service.ts',
        'src/services/finance/pricing.service.ts',
        'src/services/orders/order-refund.service.ts',
        'src/services/providers/failover.service.ts',
        'src/services/providers/service-guardian.service.ts',
        'src/services/support/ticket.service.ts',
        'src/services/utils.ts'
    ];
    
    const isTargetFile = filesWithAdminLogUserId.some(f => file.replace(/\\/g, '/').endsWith(f));
    
    if (isTargetFile) {
        // Replace `userId:` with `adminId:` inside adminLog declarations.
        // Also remove `projectId: ... ,` or `projectId: ...`
        
        let inAdminLog = false;
        let lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('prisma.adminLog.create')) {
                inAdminLog = true;
            }
            if (inAdminLog) {
                if (lines[i].includes('userId:') && !lines[i].includes('adminId:')) {
                    lines[i] = lines[i].replace(/userId\s*:/, 'adminId:');
                }
                if (lines[i].includes('projectId:') && !lines[i].includes('adminId:')) {
                     // remove projectId line entirely, or comment it out
                     lines[i] = '// ' + lines[i] + ' /* removed projectId for adminLog */';
                }
            }
            // Simple scope ending (naive but works for usual indent)
            if (inAdminLog && lines[i].includes('})') || lines[i].trim() === '});') {
                if (!lines[i].includes('where')) { // heuristic
                    inAdminLog = false;
                }
            }
        }
        
        // Also in admin-data.service.ts line 1004:
        // `by: ['userId']` -> `by: ['adminId']`
        // `_count: { userId: true }` -> `_count: { adminId: true }`
        if (file.includes('admin-data.service.ts') || file.includes('admin-user.service.ts')) {
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes("by: ['userId']")) lines[i] = lines[i].replace("'userId'", "'adminId'");
                if (lines[i].includes('userId')) {
                     const prev1 = i > 0 ? lines[i-1] : '';
                     const prev2 = i > 1 ? lines[i-2] : '';
                     if (prev1.includes('prisma.adminLog') || prev2.includes('prisma.adminLog')) {
                         lines[i] = lines[i].replace('userId:', 'adminId:');
                     }
                }
            }
        }
        
        content = lines.join('\n');
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated adminLog inputs in: ${file}`);
        changesCount++;
    }
}

console.log(`Fixes complete: ${changesCount} files modified.`);

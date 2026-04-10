const fs = require('fs');

const fixAdminFiles = () => {
    const adminData = 'src/services/admin/admin-data.service.ts';
    if (fs.existsSync(adminData)) {
        let content = fs.readFileSync(adminData, 'utf8');
        
        // From script 16
        content = content.replace(/\.systemLog/g, '.adminLog');
        content = content.replace(/\(user, log\)/g, '(user: any, log: any)');
        content = content.replace(/user:\s*true/g, '/* user: true */');
        
        // From script 14
        content = content.replace(/internalService:\s*true/g, '/* internalService: true */');
        
        // From script 17
        content = content.replace(/by:\s*\['userId'\]/g, "by: ['adminId']");
        content = content.replace(/b\.userId/g, "b.adminId");
        content = content.replace(/stats\._count\.id/g, "stats._count._all");
        content = content.replace(/_count:\s*{\s*id:\s*true\s*}/g, "_count: { _all: true }");
        
        // Specific payload fixes for AdminLog
        // For adminLog create:
        content = content.replace(/userId:\s*req\.userId/g, "adminId: req.userId?.toString() || req.adminId?.toString() || '0'");
        content = content.replace(/userId:\s*parseInt\(req\.userId\)/g, "adminId: parseInt(req?.userId?.toString() || '0')");

        fs.writeFileSync(adminData, content);
    }
    
    const adminUser = 'src/services/admin/admin-user.service.ts';
    if (fs.existsSync(adminUser)) {
        let content = fs.readFileSync(adminUser, 'utf8');
        
        // From script 16
        content = content.replace(/\.systemLog/g, '.adminLog');
        content = content.replace(/\(user, log\)/g, '(user: any, log: any)');
        
        // From script 17
        content = content.replace(/by:\s*\['userId'\]/g, "by: ['adminId']");
        content = content.replace(/b\.userId/g, "b.adminId");
        content = content.replace(/stats\._count\.id/g, "stats._count._all");
        content = content.replace(/_count:\s*{\s*id:\s*true\s*}/g, "_count: { _all: true }");
        
        fs.writeFileSync(adminUser, content);
    }
}

fixAdminFiles();

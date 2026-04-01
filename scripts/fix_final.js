const fs = require('fs');

const fixFinal = () => {
    // 1. Admin Data & User:
    const adminData = 'src/services/admin/admin-data.service.ts';
    if (fs.existsSync(adminData)) {
        let content = fs.readFileSync(adminData, 'utf8');
        content = content.replace(/\.systemLog/g, '.adminLog');
        content = content.replace(/\(user, log\)/g, '(user: any, log: any)');
        fs.writeFileSync(adminData, content);
    }
    
    const adminUser = 'src/services/admin/admin-user.service.ts';
    if (fs.existsSync(adminUser)) {
        let content = fs.readFileSync(adminUser, 'utf8');
        content = content.replace(/\.systemLog/g, '.adminLog');
        content = content.replace(/\(user, log\)/g, '(user: any, log: any)');
        fs.writeFileSync(adminUser, content);
    }

    // 2. log.service.ts
    const logService = 'src/services/admin/log.service.ts';
    if (fs.existsSync(logService)) {
        let content = fs.readFileSync(logService, 'utf8');
        content = content.replace(/type:\s*[^,]+,/g, ""); 
        fs.writeFileSync(logService, content);
    }

    // 3. catalog.service.ts duplicate config
    const catalogService = 'src/services/core/catalog.service.ts';
    if (fs.existsSync(catalogService)) {
        let content = fs.readFileSync(catalogService, 'utf8');
        content = content.replace(/metadata: true,\s*metadata: true,/g, "metadata: true,");
        content = content.replace(/config: true,/g, "/* config removed */");
        fs.writeFileSync(catalogService, content);
    }

    // 4. migration.service.ts
    const migration = 'src/services/core/migration.service.ts';
    if (fs.existsSync(migration)) {
        let content = fs.readFileSync(migration, 'utf8');
         content = content.replace(/type:\s*"MIGRATION",/g, ""); // removing type from adminLog
         content = content.replace(/type:\s*"ADMIN_ACTION",/g, ""); // if present
         content = content.replace(/adminId: user\.id/g, "userId: user.id"); // restoring ledger userId
         content = content.replace(/config:/g, "metadata:"); // fixing any remaining config
         fs.writeFileSync(migration, content);
    }
    
    // 5. ledger.service.ts
    const ledger = 'src/services/finance/ledger.service.ts';
    if (fs.existsSync(ledger)) {
        let content = fs.readFileSync(ledger, 'utf8');
        content = content.replace(/category:/g, "description:");
        fs.writeFileSync(ledger, content);
    }

    // 7. failover.service.ts
    const failover = 'src/services/providers/failover.service.ts';
    if (fs.existsSync(failover)) {
        let content = fs.readFileSync(failover, 'utf8');
        content = content.replace(/type:\s*"SYSTEM_ACTION",/g, "");
        fs.writeFileSync(failover, content);
    }
};

fixFinal();

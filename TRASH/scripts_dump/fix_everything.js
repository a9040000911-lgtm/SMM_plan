const fs = require('fs');

const fixAllTs = (file) => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // 1. Basic easy renames
    content = content.replace(/systemLog(?=\.|\()/g, 'adminLog');
    content = content.replace(/financialLedger(?=\.|\(|:)/g, 'ledgerEntry');
    content = content.replace(/maxBotToken/g, 'botToken');
    // Ensure we don't duplicate botToken if it was already fixed
    content = content.replace(/botToken:\s*project\.botToken,\s*botToken:\s*project\.botToken/g, "botToken: project.botToken");
    
    // User model phone -> whatsapp
    if (file.includes('max-messenger.service.ts') || file.includes('notification.service.ts')) {
        content = content.replace(/\.phone/g, ".whatsapp");
    }

    // Ledger Service enums
    if (file.includes('ledger.service.ts')) {
        content = content.replace(/'DEBIT'/g, "'WITHDRAWAL'");
        content = content.replace(/'CREDIT'/g, "'DEPOSIT'");
        content = content.replace(/"DEBIT"/g, "'WITHDRAWAL'");
        content = content.replace(/"CREDIT"/g, "'DEPOSIT'");
    }

    // InternalService config -> projectOverrides
    if (file.includes('catalog.service.ts') || file.includes('migration.service.ts')) {
        content = content.replace(/config(?=:)/g, 'projectOverrides'); // config: -> projectOverrides:
        content = content.replace(/\.config/g, '.projectOverrides'); // .config -> .projectOverrides
        content = content.replace(/projectOverrides:\s*p\.projectOverrides,\s*projectOverrides:\s*p\.projectOverrides/g, "projectOverrides: p.projectOverrides");
        content = content.replace(/projectOverrides:\s*service\.projectOverrides,\s*projectOverrides:\s*service\.projectOverrides/g, "projectOverrides: service.projectOverrides");
    }

    // 2. Safe adminLog.create mapping
    let segments = content.split('adminLog.create(');
    for (let i = 1; i < segments.length; i++) {
        let endIdx = segments[i].indexOf('})');
        let closeIdx = segments[i].indexOf('});');
        let end = closeIdx !== -1 ? Math.min(endIdx !== -1 ? endIdx : closeIdx, closeIdx + 1) : endIdx;

        if (end !== -1) {
            let block = segments[i].substring(0, end);
            
            // Map userId -> adminId
            block = block.replace(/userId\s*:/g, 'adminId:');
            // Remove `type: 'XYZ'` since AdminLog has no type
            block = block.replace(/\s*type:\s*['"][A-Z\_]+['"]\s*,?/g, '');
            // Remove `oldValue`
            block = block.replace(/\s*oldValue:\s*[^,]+,?\s*/g, '');
            // Remove `projectId` if present (like in orders/route.ts)
            block = block.replace(/\s*projectId:\s*[a-zA-Z\.]+\s*,?/g, '');
            
            segments[i] = block + segments[i].substring(end);
        }
    }
    content = segments.join('adminLog.create(');

    // 3. Safe ledgerEntry.create mapping
    segments = content.split('ledgerEntry.create(');
    for (let i = 1; i < segments.length; i++) {
        let endIdx = segments[i].indexOf('})');
        if (endIdx !== -1) {
            let block = segments[i].substring(0, endIdx);
            block = block.replace(/\s*category:\s*['"\A-Za-z0-9\_]+['"]\s*,?/g, '');
            // Rename correlationId to referenceId if it exists in ledgerEntry mapping
            block = block.replace(/\bcorrelationId\b/g, 'referenceId');
            segments[i] = block + segments[i].substring(endIdx);
        }
    }
    content = segments.join('ledgerEntry.create(');

    // 4. AdminData and AdminUser aggregate fixes
    if (file.includes('admin-data.service.ts') || file.includes('admin-user.service.ts')) {
        content = content.replace(/by:\s*\['userId'\]/g, "by: ['adminId']");
        content = content.replace(/_count:\s*\{\s*userId:\s*true\s*\}/g, "_count: { adminId: true }");
        content = content.replace(/stats\._count\.id/g, "(stats._count?.id || 0)");
        content = content.replace(/stats\._max/g, "(stats._max || {})");
        
        // Removed aggressive replacement here
    }
    // 5. AdminData Order mapping (internalService -> internalServiceId)
    // admin-data.service.ts lines 268-275
    // Actually, `internalService` does not exist on the type, wait!
    // It's inside a raw query or mapping! 
    if (file.includes('admin-data.service.ts')) {
        // Safe mapping
        // In CSV export mapping `o.internalService?.name` is missing from include!
        // I will fix `OrderInclude` in `admin-data.service.ts` to include internalService!
        content = content.replace(/include:\s*\{\s*user:\s*true/g, "include: { user: true, internalService: true");
    }

    fs.writeFileSync(file, content);
}

const targetFiles = [
    'src/app/api/admin/auth/reset-password/route.ts',
    'src/app/api/admin/auth/route.ts',
    'src/app/api/client/orders/route.ts',
    'src/app/api/admin/loyalty/stats/route.ts',
    'src/services/admin/admin-data.service.ts',
    'src/services/admin/admin-user.service.ts',
    'src/services/admin/log.service.ts',
    'src/services/core/catalog.service.ts',
    'src/services/core/max-messenger.service.ts',
    'src/services/core/migration.service.ts',
    'src/services/core/notification.service.ts',
    'src/services/core/self-healing.service.ts',
    'src/services/finance/pricing.service.ts',
    'src/services/finance/ledger.service.ts',
    'src/services/orders/order-refund.service.ts',
    'src/services/providers/failover.service.ts',
    'src/services/providers/service-guardian.service.ts',
    'src/services/support/ticket.service.ts',
    'src/services/utils.ts'
];

targetFiles.forEach(f => {
    fixAllTs(f);
    console.log(`Processed ${f}`);
});

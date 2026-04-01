const fs = require('fs');
const glob = require('glob'); // Need to find all files

const replaceMap = {
    'systemLog': 'adminLog',
    'financialLedger': 'ledgerEntry',
    'maxBotToken': 'botToken',
    'phone': 'whatsapp',
    'config': 'metadata'
};

const fixTS = () => {
    const files = [
        'src/services/admin/admin-data.service.ts',
        'src/services/admin/admin-user.service.ts',
        'src/services/admin/log.service.ts',
        'src/services/core/catalog.service.ts',
        'src/services/core/max-messenger.service.ts',
        'src/services/core/migration.service.ts',
        'src/services/core/notification.service.ts',
        'src/services/finance/ledger.service.ts',
        'src/services/orders/order-refund.service.ts',
        'src/services/providers/failover.service.ts'
    ];

    files.forEach(file => {
        if (!fs.existsSync(file)) return;
        let content = fs.readFileSync(file, 'utf8');
        
        // systemLog -> adminLog
        content = content.replace(/\.systemLog/g, '.adminLog');
        
        // AdminLog parameter fixes: (user: any, log: any) => etc...
        if (file.includes('admin-data.service.ts') || file.includes('admin-user.service.ts')) {
             content = content.replace(/\(user, log\)/g, '(user: any, log: any)');
        }
        
        // financialLedger -> ledgerEntry
        content = content.replace(/\.financialLedger/g, '.ledgerEntry');
        
        // maxBotToken -> botToken
        content = content.replace(/maxBotToken/g, 'botToken');
        
        // phone -> whatsapp
        content = content.replace(/phone:/g, 'whatsapp:');
        content = content.replace(/\.phone/g, '.whatsapp');

        // catalog.service.ts config->metadata
        if (file.includes('catalog.service.ts')) {
            content = content.replace(/config:/g, 'metadata:');
            content = content.replace(/projectOverrides/g, 'metadata'); // Quick hack for projectOverrides
        }

        // migration.service.ts config->metadata
        if (file.includes('migration.service.ts')) {
            content = content.replace(/config:/g, 'metadata:');
        }

        fs.writeFileSync(file, content);
    });
};

fixTS();
console.log('Fixed TS 16');

const fs = require('fs');

const ledgerReplacements = [
    { file: 'src/app/api/client/orders/route.ts', rgx: /type:\s*['"]CREDIT['"]/g, repl: 'type: "REFUND"' }, // usually refunding order
    { file: 'src/app/api/client/orders/route.ts', rgx: /type:\s*['"]DEBIT['"]/g, repl: 'type: "WITHDRAWAL"' }, // usually creating order
    { file: 'src/services/core/migration.service.ts', rgx: /type:\s*['"]DEBIT['"]/g, repl: 'type: "WITHDRAWAL"' },
    { file: 'src/services/core/migration.service.ts', rgx: /type:\s*['"]CREDIT['"]/g, repl: 'type: "DEPOSIT"' },
    { file: 'src/services/finance/ledger.service.ts', rgx: /type: 'DEBIT' \| 'CREDIT'/g, repl: "type: 'WITHDRAWAL' | 'DEPOSIT'" },
    { file: 'src/services/finance/ledger.service.ts', rgx: /type:\s*['"]DEBIT['"]/g, repl: 'type: "WITHDRAWAL"' },
    { file: 'src/services/finance/ledger.service.ts', rgx: /type:\s*['"]CREDIT['"]/g, repl: 'type: "DEPOSIT"' }
];

ledgerReplacements.forEach(({ file, rgx, repl }) => {
    if (fs.existsSync(file)) {
        let text = fs.readFileSync(file, 'utf8');
        text = text.replace(rgx, repl);
        fs.writeFileSync(file, text);
        console.log(`Replaced ledger types in ${file}`);
    }
});

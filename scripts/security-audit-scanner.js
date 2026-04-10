const fs = require('fs');
const path = require('path');

function walk(dir, fn) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        const d = path.join(dir, f);
        if (fs.statSync(d).isDirectory()) walk(d, fn);
        else fn(d);
    });
}

const findErrors = [];

function checkRegex(file, content, regexes, domain) {
    for (const r of regexes) {
        const match = content.match(r.regex);
        if (match) {
            match.forEach(m => {
                findErrors.push(`[${domain}] ${file}: MATCHED "${r.name}"`);
            });
        }
    }
}

walk('./src', (f) => {
    if (!f.endsWith('.ts') && !f.endsWith('.tsx')) return;
    const content = fs.readFileSync(f, 'utf8');

    // DOMAIN 1: AUth
    checkRegex(f, content, [
        {name: 'Assigning userId directly', regex: /userId\s*=\s*(existing|user)\.id/gi},
        {name: 'Using body.email directly', regex: /body\.email/g}
    ], 'DOMAIN 1: Auth/ATO');

    // DOMAIN 2: Info Disclosure
    checkRegex(f, content, [
        {name: 'Leaking Env', regex: /process\.env\.[A-Z_]+/g},
        {name: 'Header Leak', regex: /req\.headers\.entries/g},
        {name: 'Error message leak', regex: /(NextResponse\.json|return).*error\.message/g}
    ], 'DOMAIN 2: Info Disclosure');

    // DOMAIN 3: IDOR
    if (f.includes('api/client')) {
        const findMatches = content.match(/findUnique\s*\(\s*\{\s*where:\s*\{[^\}]+id:[^\}]+\}/g);
        if (findMatches) {
            findMatches.forEach(m => {
                if (!m.includes('userId') && !m.includes('projectId')) {
                    findErrors.push(`[DOMAIN 3: IDOR] ${f}: findUnique without userId/projectId scoping`);
                }
            });
        }
    }

    // DOMAIN 4: DoS
    checkRegex(f, content, [
        {name: 'parseInt without Math.min/max', regex: /parseInt\([^)]+\)(?!.*Math\.min)/g}
    ], 'DOMAIN 4: DoS');

    // DOMAIN 9: Server Actions
    if (content.includes('"use server"') || content.includes("'use server'")) {
        if (!content.match(/session|auth\(\)|verifyAdmin|validateProject/) && f.includes('actions') && !f.includes('tests')) {
            findErrors.push(`[DOMAIN 9: Next.js] ${f}: Server Action has NO auth check inside!`);
        }
    }

    // DOMAIN 18: Price Manipulation
    checkRegex(f, content, [
        {name: 'Trusting Client Price', regex: /(body|request)\.(price|totalPrice|cost)/g}
    ], 'DOMAIN 18: Price Manipulation');

    // DOMAIN 17: V2 API Over-exposure
    if (f.includes('api\\v2') || f.includes('api/v2')) {
        checkRegex(f, content, [
            {name: 'Leaking margin data', regex: /(costPrice|lastProviderPrice|rawPrice)/gi}
        ], 'DOMAIN 17: V2 Sandbox');
    }
});

// Domain 6: Headers
try {
    const nextConfig = fs.readFileSync('./next.config.js', 'utf8');
    if (!nextConfig.includes('Strict-Transport-Security')) findErrors.push('[DOMAIN 6: Headers] HSTS not found in next.config.js');
    if (!nextConfig.includes('Content-Security-Policy')) findErrors.push('[DOMAIN 6: Headers] CSP not found in next.config.js');
} catch (e) {}

fs.writeFileSync('./scripts/security_audit_report.txt', [...new Set(findErrors)].join('\n'));
console.log(`Scan completed. Found ${new Set(findErrors).size} potential items. Check security_audit_report.txt`);

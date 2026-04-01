#!/usr/bin/env node
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 *
 * Security Audit CI Script (Pure Node.js)
 * Run: node scripts/security-audit.mjs
 * 
 * Based on Security Reverse Engineering Audit v3 (20 domains)
 * Exit code 1 = vulnerabilities found (blocks CI pipeline)
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import path from 'path';

const SRC = path.resolve('src');
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let findings = [];
let warnings = [];

// Cross-platform grep implementation in Node.js
function walkSync(dir, callback) {
    if (!existsSync(dir)) return;
    const files = readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        if (statSync(filepath).isDirectory()) {
            walkSync(filepath, callback);
        } else {
            callback(filepath);
        }
    }
}

function grep(regexStr, searchPath = SRC, flags = '') {
    const regex = new RegExp(regexStr, flags);
    const results = [];
    let fileCount = 0;
    
    walkSync(searchPath, (filepath) => {
        // Only check .ts, .tsx files, ignore .test.ts, .spec.ts, node_modules
        if (!filepath.endsWith('.ts') && !filepath.endsWith('.tsx')) return;
        if (filepath.endsWith('.test.ts') || filepath.endsWith('.spec.ts')) return;
        if (filepath.includes('node_modules')) return;
        // [TUNE] Ignore generated code and CLI scripts
        if (filepath.includes(path.join('src', 'generated'))) return;
        if (filepath.includes(path.join('src', 'scripts'))) return;

        try {
            const content = readFileSync(filepath, 'utf-8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (regex.test(lines[i])) {
                    const relativePath = path.relative(process.cwd(), filepath);
                    results.push(`${relativePath}:${i + 1}: ${lines[i].trim()}`);
                }
            }
        } catch (e) {
            // Ignore unreadable files
        }
    });

    return results;
}

function addFinding(severity, domain, id, description, matches) {
    if (matches && matches.length > 0) {
        findings.push({ severity, domain, id, description, matches: matches.slice(0, 5) });
    }
}

function addWarning(domain, id, description, matches) {
    if (matches && matches.length > 0) {
        warnings.push({ domain, id, description, matches: matches.slice(0, 3) });
    }
}

console.log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${RESET}`);
console.log(`${BOLD}${CYAN}║  Smmplan Security Audit CI — v3 (20 Domains)        ║${RESET}`);
console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${RESET}\n`);

// ═══════════════════════════════════════════
// DOMAIN 1: Account Takeover & Auth
// ═══════════════════════════════════════════
console.log(`${CYAN}[D1] Account Takeover & Auth...${RESET}`);

addFinding('HIGH', 'D1', 'AUTH-001', 'Hardcoded credentials or secrets in source',
    grep('(password|secret|token)\\s*[:=]\\s*["\'][^"\']{8,}["\']', SRC, 'i'));

// ═══════════════════════════════════════════
// DOMAIN 2: Information Disclosure
// ═══════════════════════════════════════════
console.log(`${CYAN}[D2] Information Disclosure...${RESET}`);

addFinding('HIGH', 'D2', 'INFO-001', 'error.message exposed to client in API response',
    grep('error:\\s*(err|error)\\.message', path.join(SRC, 'app', 'api')));

addFinding('MEDIUM', 'D2', 'INFO-002', 'console.log with sensitive data patterns',
    grep('console\\.log.*(?:apiKey|password|secret|token)', SRC, 'i'));

addFinding('HIGH', 'D2', 'INFO-003', 'Stack trace exposed in production',
    grep('error\\.stack', path.join(SRC, 'app', 'api')));

// ═══════════════════════════════════════════
// DOMAIN 3: IDOR
// ═══════════════════════════════════════════
console.log(`${CYAN}[D3] IDOR checks...${RESET}`);

addWarning('D3', 'IDOR-001', 'Direct params.id usage without ownership check (review needed)',
    grep('params\\.(id|userId|orderId).*findUnique', path.join(SRC, 'app', 'api')));

// ═══════════════════════════════════════════
// DOMAIN 4: DoS — Unbounded Queries
// ═══════════════════════════════════════════
console.log(`${CYAN}[D4] DoS — Unbounded Queries...${RESET}`);

addFinding('MEDIUM', 'D4', 'DOS-001', 'findMany without take/limit (potential unbounded query)',
    grep('findMany\\(\\{[^}]*(?!take)[^}]*\\}\\)', path.join(SRC, 'app', 'api')));

// ═══════════════════════════════════════════
// DOMAIN 5: Security Headers
// ═══════════════════════════════════════════
console.log(`${CYAN}[D5] Security Headers...${RESET}`);

const middlewarePath = path.resolve('src/middleware.ts');
if (existsSync(middlewarePath)) {
    const middleware = readFileSync(middlewarePath, 'utf-8');
    if (!middleware.includes('Strict-Transport-Security')) {
        addWarning('D5', 'HDR-001', 'HSTS header not found in middleware', ['src/middleware.ts: HSTS header missing']);
    }
    if (!middleware.includes('Content-Security-Policy')) {
        addWarning('D5', 'HDR-002', 'CSP header not found in middleware', ['src/middleware.ts: CSP header missing']);
    }
}

// ═══════════════════════════════════════════
// DOMAIN 6: Fail-Open Patterns
// ═══════════════════════════════════════════
console.log(`${CYAN}[D6] Fail-Open Patterns...${RESET}`);

addFinding('HIGH', 'D6', 'FAIL-001', 'Empty catch block (potential fail-open)',
    grep('catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}', SRC));

addWarning('D6', 'FAIL-002', 'catch block with only console.log (no error handling)',
    grep('catch.*\\{\\s*console\\.(log|warn)', path.join(SRC, 'app', 'api')));

// ═══════════════════════════════════════════
// DOMAIN 7: Prototype Pollution
// ═══════════════════════════════════════════
console.log(`${CYAN}[D7] Prototype Pollution...${RESET}`);

addFinding('HIGH', 'D7', 'PROTO-001', 'Object spread from unvalidated input (proto pollution risk)',
    grep('\\.\\.\\.(?:body|req\\.body|data|input)(?!\\.)\\b', path.join(SRC, 'app', 'api')));

// ═══════════════════════════════════════════
// DOMAIN 8: SSRF
// ═══════════════════════════════════════════
console.log(`${CYAN}[D8] SSRF...${RESET}`);

addFinding('HIGH', 'D8', 'SSRF-001', 'fetch/axios with user-controlled URL without validation',
    grep('(?:fetch|axios)\\(.*(?:body|params|query)', path.join(SRC, 'app', 'api'), 'i'));

// ═══════════════════════════════════════════
// DOMAIN 9: Race Conditions
// ═══════════════════════════════════════════
console.log(`${CYAN}[D9] Race Conditions...${RESET}`);

addWarning('D9', 'RACE-001', 'Balance update without transaction lock (review needed)',
    grep('balance.*increment(?!.*\\$transaction)', SRC));

// ═══════════════════════════════════════════
// DOMAIN 10: Supply Chain
// ═══════════════════════════════════════════
console.log(`${CYAN}[D10] Supply Chain...${RESET}`);

try {
    execSync('npm audit --production --audit-level=high 2>&1', { encoding: 'utf-8', timeout: 30000 });
} catch (e) {
    if (e.stdout && e.stdout.includes('found')) {
        const match = e.stdout.split('\n').find(l => l.includes('vulnerabilities'));
        if (match) {
            addFinding('HIGH', 'D10', 'SUPPLY-001', 'npm audit found high/critical vulnerabilities', [match]);
        }
    }
}

// ═══════════════════════════════════════════
// DOMAIN 11-15: Framework-specific
// ═══════════════════════════════════════════
console.log(`${CYAN}[D11-15] Framework-specific checks...${RESET}`);

addFinding('MEDIUM', 'D11', 'NEXT-001', 'dangerouslySetInnerHTML usage',
    grep('dangerouslySetInnerHTML', SRC));

addFinding('MEDIUM', 'D12', 'CRYPTO-001', 'Weak hash algorithm (MD5/SHA1) in security context',
    grep('createHash\\(["\'](?:md5|sha1)["\']\\)', SRC));

// ═══════════════════════════════════════════
// DOMAIN 16: Provider API Security (SMM)
// ═══════════════════════════════════════════
console.log(`${CYAN}[D16] Provider API Security...${RESET}`);

addFinding('HIGH', 'D16', 'PROV-001', 'Provider apiKey exposed via Object spread',
    grep('\\.\\.\\.(?:provider|p)\\b', path.join(SRC, 'app', 'api', 'admin', 'providers')));

// ═══════════════════════════════════════════
// DOMAIN 17: Reseller API v2 Abuse (SMM)
// ═══════════════════════════════════════════
console.log(`${CYAN}[D17] Reseller API v2...${RESET}`);

const v2Path = path.join(SRC, 'app', 'api', 'v2');
if (existsSync(v2Path)) {
    const v2Content = readFileSync(path.join(v2Path, 'route.ts'), 'utf-8');
    if (!v2Content.includes('checkRateLimit') && !v2Content.includes('rateLimit')) {
        addFinding('HIGH', 'D17', 'V2-001', 'No rate limiting on /api/v2', ['src/app/api/v2/route.ts: missing rate limit']);
    }
    if (v2Content.match(/error:\s*(?:err|error)\.message/)) {
        addFinding('HIGH', 'D17', 'V2-002', 'Internal error messages leaked in V2 API', ['src/app/api/v2/route.ts: leaking error message']);
    }
    if (v2Content.includes('costPrice') || v2Content.includes('lastProviderPrice')) {
        addFinding('HIGH', 'D17', 'V2-003', 'Cost/provider price leaked to reseller API', ['src/app/api/v2/route.ts: leaking costPrice']);
    }
}

// ═══════════════════════════════════════════
// DOMAIN 18: Price Manipulation (SMM)
// ═══════════════════════════════════════════
console.log(`${CYAN}[D18] Price Manipulation...${RESET}`);

addFinding('CRITICAL', 'D18', 'PRICE-001', 'Client-supplied price accepted in API',
    grep('body\\.(?:price|totalPrice|cost)', path.join(SRC, 'app', 'api', 'client')));

// ═══════════════════════════════════════════
// DOMAIN 19: TMA Auth (SMM)
// ═══════════════════════════════════════════
console.log(`${CYAN}[D19] TMA Authentication...${RESET}`);

const tmaPath = path.resolve('src/lib/telegram/auth.ts');
if (existsSync(tmaPath)) {
    const tma = readFileSync(tmaPath, 'utf-8');
    if (!tma.includes('auth_date')) {
        addFinding('HIGH', 'D19', 'TMA-001', 'TMA auth_date replay check missing', ['src/lib/telegram/auth.ts: missing auth_date validation']);
    }
    if (!tma.includes('CryptoService.decrypt') && !tma.includes('createHmac')) {
        addFinding('HIGH', 'D19', 'TMA-002', 'TMA HMAC verification missing', ['src/lib/telegram/auth.ts: missing HMAC check']);
    }
}

// ═══════════════════════════════════════════
// DOMAIN 20: Order Queue (SMM)
// ═══════════════════════════════════════════
console.log(`${CYAN}[D20] Order Queue Exploitation...${RESET}`);

addWarning('D20', 'QUEUE-001', 'DripFeed runs without upper bound',
    grep('runs.*<\\s*2', path.join(SRC, 'app', 'api', 'client', 'orders')).length > 0 &&
    grep('runs.*>\\s*\\d', path.join(SRC, 'app', 'api', 'client', 'orders')).length === 0
        ? ['src/app/api/client/orders/route.ts: runs bound logic missing'] : []);


// ═══════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════
console.log(`\n${BOLD}═══════════════════════════════════════════════════${RESET}`);
console.log(`${BOLD}                    RESULTS${RESET}`);
console.log(`${BOLD}═══════════════════════════════════════════════════${RESET}\n`);

const criticals = findings.filter(f => f.severity === 'CRITICAL');
const highs = findings.filter(f => f.severity === 'HIGH');
const mediums = findings.filter(f => f.severity === 'MEDIUM');

if (findings.length === 0 && warnings.length === 0) {
    console.log(`${GREEN}${BOLD}✅ ALL CLEAR — No security issues detected!${RESET}\n`);
    process.exit(0);
}

function truncateString(str, num) {
    if (str.length <= num) return str;
    return str.replace(/\s+/g, ' ').slice(0, num) + '...';
}

// Print findings
for (const f of findings) {
    const color = f.severity === 'CRITICAL' ? RED : f.severity === 'HIGH' ? RED : YELLOW;
    console.log(`${color}${BOLD}[${f.severity}]${RESET} ${f.id} (${f.domain}): ${f.description}`);
    for (const m of f.matches) {
        console.log(`  ${color}→${RESET} ${truncateString(String(m), 120)}`);
    }
    console.log('');
}

// Print warnings
if (warnings.length > 0) {
    console.log(`${YELLOW}${BOLD}── Warnings (manual review recommended) ──${RESET}\n`);
    for (const w of warnings) {
        console.log(`${YELLOW}[WARN]${RESET} ${w.id} (${w.domain}): ${w.description}`);
        for (const m of w.matches) {
            console.log(`  ${YELLOW}→${RESET} ${truncateString(String(m), 120)}`);
        }
        console.log('');
    }
}

// Summary
console.log(`${BOLD}═══════════════════════════════════════════════════${RESET}`);
console.log(`${BOLD}Summary:${RESET}`);
console.log(`  ${RED}CRITICAL: ${criticals.length}${RESET}`);
console.log(`  ${RED}HIGH:     ${highs.length}${RESET}`);
console.log(`  ${YELLOW}MEDIUM:   ${mediums.length}${RESET}`);
console.log(`  ${YELLOW}WARNINGS: ${warnings.length}${RESET}`);
console.log(`${BOLD}═══════════════════════════════════════════════════${RESET}\n`);

// Exit code: fail on CRITICAL or HIGH
if (criticals.length > 0 || highs.length > 0) {
    console.log(`${RED}${BOLD}❌ PIPELINE BLOCKED — Fix CRITICAL/HIGH findings before deploy${RESET}\n`);
    process.exit(1);
} else {
    console.log(`${YELLOW}⚠️  Warnings present — review recommended but pipeline passes${RESET}\n`);
    process.exit(0);
}

const fs = require('fs');

const data = JSON.parse(fs.readFileSync('all_canceled_orders.json', 'utf8'));
const descriptions = JSON.parse(fs.readFileSync('toolbox_services_with_descriptions.json', 'utf8'));

const serviceMeta = {};
descriptions.forEach(s => {
    const d = (s.description || '').toLowerCase();
    serviceMeta[s.name] = {
        isPublicOnly: d.includes('открыт') || d.includes('публичный') || !d.includes('приват'),
        category: s.category
    };
});

const patterns = {
    platformMismatches: {}, // { Telegram: { privateToPublic: X, totalCanceled: Y } }
    serialFailures: {},     // Users who repeat mismatch
    serviceTrapNames: {},   // Services with highest mismatch rate
    linkFormatIssues: {
        mobile: 0,          // m.vk.com, mobile.twitter
        trailingParams: 0,  // ?igsh=...
        oddFormats: []      // weird links to inspect
    }
};

data.forEach(o => {
    const link = o.link.toLowerCase();
    const meta = serviceMeta[o.service];
    const isPrivate = link.includes('+') || link.includes('joinchat') || link.includes('/c/');
    const hasParams = link.includes('?');
    const isMobile = link.includes('m.') || link.includes('mobile.');

    // 1. Platform Mismatches
    if (!patterns.platformMismatches[o.category]) {
        patterns.platformMismatches[o.category] = { privateToPublic: 0, total: 0 };
    }
    patterns.platformMismatches[o.category].total++;
    if (isPrivate && meta && meta.isPublicOnly) {
        patterns.platformMismatches[o.category].privateToPublic++;
        
        // 2. Serial Failures
        if (!patterns.serialFailures[o.user]) patterns.serialFailures[o.user] = 0;
        patterns.serialFailures[o.user]++;
    }

    // 3. Service Trap Names
    if (isPrivate && meta && meta.isPublicOnly) {
        patterns.serviceTrapNames[o.service] = (patterns.serviceTrapNames[o.service] || 0) + 1;
    }

    // 4. Link Formats
    if (hasParams) patterns.linkFormatIssues.trailingParams++;
    if (isMobile) patterns.linkFormatIssues.mobile++;
});

const report = {
    mismatch_by_platform: patterns.platformMismatches,
    top_trap_services: Object.entries(patterns.serviceTrapNames).sort((a,b) => b[1]-a[1]).slice(0, 15),
    top_serial_failures: Object.entries(patterns.serialFailures).sort((a,b) => b[1]-a[1]).slice(0, 10),
    link_issues: patterns.linkFormatIssues
};

fs.writeFileSync('deep_patterns_analysis.json', JSON.stringify(report, null, 2));
console.log('Deep analysis complete.');

const fs = require('fs');

const data = JSON.parse(fs.readFileSync('all_canceled_orders.json', 'utf8'));

const analysis = {
    byCategory: {},
    byService: {},
    linkPatterns: {
        privateTg: 0,
        instagramWithParams: 0,
        vkMobile: 0,
        shortLinks: 0
    },
    topFailedUsers: {}
};

data.forEach(o => {
    // Categories
    analysis.byCategory[o.category] = (analysis.byCategory[o.category] || 0) + 1;
    
    // Services
    analysis.byService[o.service] = (analysis.byService[o.service] || 0) + 1;
    
    // Links
    const link = o.link.toLowerCase();
    if (link.includes('t.me/+') || link.includes('joinchat')) analysis.linkPatterns.privateTg++;
    if (link.includes('instagram.com') && link.includes('?')) analysis.linkPatterns.instagramWithParams++;
    if (link.includes('vk.com/m/') || link.includes('m.vk.com')) analysis.linkPatterns.vkMobile++;
    if (link.length < 20) analysis.linkPatterns.shortLinks++;

    // Users
    analysis.topFailedUsers[o.user] = (analysis.topFailedUsers[o.user] || 0) + 1;
});

// Sorting function
const sortObj = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 15);

const report = {
    totalAnalyzed: data.length,
    topFailedCategories: sortObj(analysis.byCategory),
    topFailedServices: sortObj(analysis.byService),
    linkPatterns: analysis.linkPatterns,
    topFailedUsers: sortObj(analysis.topFailedUsers)
};

fs.writeFileSync('canceled_patterns_report.json', JSON.stringify(report, null, 2));
console.log('Patterns analysis complete. Results in canceled_patterns_report.json');

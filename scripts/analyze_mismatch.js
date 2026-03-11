const fs = require('fs');

// 1. Load data
const canceled = JSON.parse(fs.readFileSync('all_canceled_orders.json', 'utf8'));
const descriptions = JSON.parse(fs.readFileSync('toolbox_services_with_descriptions.json', 'utf8'));

// 2. Map service names to their "Public Only" status based on descriptions
const serviceMeta = {};
descriptions.forEach(s => {
    const desc = (s.description || '').toLowerCase();
    const name = s.name.toLowerCase();
    
    // Logic: Is it a "Public Only" service?
    const isPublicOnly = desc.includes('открыт') || 
                         desc.includes('публичный') || 
                         desc.includes('public') || 
                         desc.includes('должен быть открыт') ||
                         !desc.includes('приват'); // If it doesn't mention private, usually it's public
    
    serviceMeta[s.name] = { isPublicOnly, id: s.id };
});

// 3. Analyze Mismatches
const results = {
    totalCanceled: canceled.length,
    privateLinkToPublicService: 0,
    mismatchExamples: [],
    brokenPublicServices: {}, // High cancellations even with public links
    categories: {}
};

canceled.forEach(o => {
    const link = o.link.toLowerCase();
    const isPrivateLink = link.includes('+') || link.includes('joinchat') || link.includes('/c/');
    const meta = serviceMeta[o.service];

    if (isPrivateLink && meta && meta.isPublicOnly) {
        results.privateLinkToPublicService++;
        if (results.mismatchExamples.length < 20) {
            results.mismatchExamples.push({
                service: o.service,
                link: o.link,
                user: o.user
            });
        }
    }

    if (!isPrivateLink) {
        results.brokenPublicServices[o.service] = (results.brokenPublicServices[o.service] || 0) + 1;
    }
});

// Sort broken services
results.topBrokenServices = Object.entries(results.brokenPublicServices)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 15);

fs.writeFileSync('canceled_mismatch_analysis.json', JSON.stringify(results, null, 2));
console.log('Mismatch analysis complete. Results in canceled_mismatch_analysis.json');

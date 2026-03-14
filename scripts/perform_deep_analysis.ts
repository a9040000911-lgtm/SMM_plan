import fs from 'fs';
import path from 'path';

async function performDeepAnalysis() {
    const DATA_DIR = path.join(process.cwd(), 'scripts', 'all_orders_data');
    if (!fs.existsSync(DATA_DIR)) {
        console.error('Data directory not found.');
        return;
    }

    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    console.log(`Processing ${files.length} chunks...`);

    const stats = {
        totalOrders: 0,
        platforms: {} as any,
        statuses: {} as any,
        topUsers: {} as any,
        topLinks: {} as any,
        platformFailures: {} as any,
        uniqueEmails: new Set()
    };

    for (const file of files) {
        const filePath = path.join(DATA_DIR, file);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const orders = JSON.parse(content);
            
            orders.forEach(o => {
                stats.totalOrders++;
                
                // Platforms
                const platform = o.category || 'Unknown';
                stats.platforms[platform] = (stats.platforms[platform] || 0) + 1;
                
                // Statuses
                stats.statuses[o.status] = (stats.statuses[o.status] || 0) + 1;
                
                // Failures per platform
                if (['Отменен', 'Исполнен частично'].includes(o.status)) {
                    stats.platformFailures[platform] = (stats.platformFailures[platform] || 0) + 1;
                }
                
                // Top Users
                if (o.user && o.user.includes('@')) {
                    const email = o.user.toLowerCase();
                    stats.uniqueEmails.add(email);
                    stats.topUsers[email] = (stats.topUsers[email] || 0) + 1;
                }
                
                // Top Links (Channels/Profiles)
                if (o.link && o.link !== '-') {
                    // Normalize link to base (remove query params)
                    const baseLink = o.link.split('?')[0].replace(/\/$/, '');
                    stats.topLinks[baseLink] = (stats.topLinks[baseLink] || 0) + 1;
                }
            });
        } catch (e) {
            console.error(`Error reading ${file}:`, e.message);
        }
    }

    // Sort results
    const sortedPlatforms = Object.entries(stats.platforms).sort((a: any, b: any) => b[1] - a[1]);
    const sortedUsers = Object.entries(stats.topUsers).sort((a: any, b: any) => b[1] - a[1]).slice(0, 20);
    const sortedLinks = Object.entries(stats.topLinks).sort((a: any, b: any) => b[1] - a[1]).slice(0, 20);

    const report = {
        meta: {
            analyzedAt: new Date().toISOString(),
            totalOrders: stats.totalOrders,
            uniqueEmails: stats.uniqueEmails.size,
            chunksProcessed: files.length
        },
        platforms: sortedPlatforms.map(([name, count]) => {
            const failures = stats.platformFailures[name] || 0;
            return {
                name,
                count,
                share: ((count as number / stats.totalOrders) * 100).toFixed(2) + '%',
                failureRate: ((failures / (count as number)) * 100).toFixed(2) + '%'
            };
        }),
        statuses: stats.statuses,
        topVIPs: sortedUsers,
        topChannels: sortedLinks
    };

    fs.writeFileSync(path.join(process.cwd(), 'scripts', 'deep_analysis_result.json'), JSON.stringify(report, null, 2));
    console.log('Analysis complete. Results saved to deep_analysis_result.json');
}

performDeepAnalysis();

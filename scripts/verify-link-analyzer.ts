import fs from 'fs';
import path from 'path';
import { IntelligenceEngine } from '../src/services/intelligence/intelligence.engine';

const DIR = path.join(process.cwd(), 'scripts', 'turbo_orders_data');

// Mapping Competitor Russian Categories to our internal slugs
const platformMap: Record<string, string> = {
    'Вконтакте': 'vk',
    'Telegram': 'telegram',
    'Instagram': 'instagram',
    'YouTube': 'youtube',
    'Youtube': 'youtube',
    'TikTok': 'tiktok',
    'Twitter': 'twitter',
    'Twitter(X)': 'twitter',
    'Twitch': 'twitch',
    'Discord': 'discord',
    'Rutube': 'rutube',
    'Facebook': 'facebook',
    'SoundCloud': 'soundcloud',
    'Spotify': 'spotify',
    'Трафик на сайт': 'website',
    'Likee': 'likee',
    'Threads': 'threads',
    'Дзен': 'dzen',
    'Авито': 'avito',
    'Одноклассники': 'ok',
    'Pinterest': 'pinterest',
    'Apple Music': 'applemusic',
    'Reddit': 'reddit'
};

async function run() {
    console.log(`Starting MASSIVE Link Analyzer Stress Test on ${DIR}`);
    const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json'));

    const results = {
        total: 0,
        success: 0,
        failures: 0,
        unmappedPlatform: 0,
        errors: [] as any[]
    };

    console.log(`Found ${files.length} JSON files. Beginning full scan...`);

    for (const file of files) {
        const filePath = path.join(DIR, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        for (const order of data) {
            results.total++;
            if (results.total % 100000 === 0) console.log(`Processed ${results.total} orders so far...`);

            const expectedSlug = platformMap[order.category] || null;
            
            if (!expectedSlug) {
                results.unmappedPlatform++;
                continue;
            }

            try {
                const analysis = await IntelligenceEngine.analyzeLink(order.link);
                const isMatch = analysis.platform.toLowerCase() === expectedSlug.toLowerCase();

                if (isMatch) {
                    results.success++;
                } else {
                    results.failures++;
                    if (results.errors.length < 5000) { // Keep report size manageable
                        results.errors.push({
                            originalLink: order.link,
                            competitorCategory: order.category,
                            expectedPlatform: expectedSlug,
                            analyzerPlatform: analysis.platform,
                            analyzerType: analysis.type
                        });
                    }
                }
            } catch (e: any) {
                results.failures++;
                if (results.errors.length < 5000) {
                    results.errors.push({
                        originalLink: order.link,
                        competitorCategory: order.category,
                        expectedPlatform: expectedSlug,
                        errorDetails: e.message
                    });
                }
            }
        }
    }
    
    fs.writeFileSync('analyzer-report.json', JSON.stringify(results, null, 2));

    console.log('\n=============================');
    console.log('TESTING COMPLETE (1.2M+ Orders)');
    console.log(`Total Tested: ${results.total}`);
    console.log(`Successes: ${results.success}`);
    console.log(`Failures: ${results.failures}`);
    console.log(`Unmapped Categories: ${results.unmappedPlatform}`);
    console.log(`Success Rate: ${((results.success / (results.total - results.unmappedPlatform)) * 100).toFixed(4)}%`);
    console.log('Report saved to analyzer-report.json');
    console.log('=============================');
}

run();

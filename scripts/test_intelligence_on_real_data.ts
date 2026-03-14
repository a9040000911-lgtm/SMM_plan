import fs from 'fs';
import path from 'path';
import { IntelligenceEngine } from '../src/services/intelligence/intelligence.engine';

async function runTest() {
    const dataPath = path.join(process.cwd(), 'scripts', 'real_orders_testing_data.json');
    if (!fs.existsSync(dataPath)) {
        console.error('Data file not found yet. Waiting for scraper...');
        return;
    }

    const orders = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`--- ANALYZING ${orders.length} REAL ORDERS ---`);

    const stats = {
        total: orders.length,
        matches: 0,
        mismatches: 0,
        errors: 0,
        unrecognized: 0,
        platformStats: {} as Record<string, { total: number, matches: number }>
    };

    for (const order of orders) {
        try {
            const result = await IntelligenceEngine.analyzeLink(order.link);
            
            // Normalize platform names for comparison
            const detectedPlatform = result.platform;
            const originalPlatform = order.category.toUpperCase();

            if (!stats.platformStats[detectedPlatform]) {
                stats.platformStats[detectedPlatform] = { total: 0, matches: 0 };
            }
            stats.platformStats[detectedPlatform].total++;

            // Heuristic matching
            const isMatch = originalPlatform.includes(detectedPlatform) || detectedPlatform.includes(originalPlatform) || 
                           (detectedPlatform === 'TELEGRAM' && originalPlatform === 'ТЕЛЕГРАМ') ||
                           (detectedPlatform === 'INSTAGRAM' && originalPlatform === 'ИНСТАГРАМ') ||
                           (detectedPlatform === 'VK' && originalPlatform === 'ВКОНТАКТЕ') ||
                           (detectedPlatform === 'TWITTER' && originalPlatform.includes('TWITTER')) ||
                           (detectedPlatform === 'TWITTER' && originalPlatform.includes('(X)')) ||
                           (detectedPlatform === 'TIKTOK' && originalPlatform.includes('TIKTOK')) ||
                           (detectedPlatform === 'TWITCH' && originalPlatform.includes('TWITCH'));

            if (isMatch) {
                stats.matches++;
                stats.platformStats[detectedPlatform].matches++;
            } else {
                stats.mismatches++;
                if (stats.mismatches < 20) {
                    console.log(`Mismatch: ID ${order.id} | Link: ${order.link} | Original: ${order.category} | Detected: ${detectedPlatform}`);
                }
            }

        } catch (e: any) {
            stats.errors++;
            console.error(`Error analyzing ${order.id}: ${e.message}`);
        }
    }

    console.log('\n--- TEST RESULTS ---');
    console.log(`Total processed: ${stats.total}`);
    console.log(`Matches: ${stats.matches} (${((stats.matches/stats.total)*100).toFixed(2)}%)`);
    console.log(`Mismatches: ${stats.mismatches}`);
    console.log(`Errors: ${stats.errors}`);
    
    console.log('\n--- BY PLATFORM ---');
    for (const [platform, pData] of Object.entries(stats.platformStats)) {
        const accuracy = ((pData.matches / pData.total) * 100).toFixed(2);
        console.log(`${platform}: ${pData.total} items, ${accuracy}% accuracy`);
    }
}

runTest();


import 'dotenv/config';
import { normalizeLink } from '../src/utils/normalizer';
import { analyzeLink } from '../src/utils/analyzer';

async function testAnalysis(link: string) {
    console.log(`\n🔍 Analyzing Link: ${link}`);
    const normalized = normalizeLink(link);
    const analysis = analyzeLink(normalized);

    if (analysis) {
        console.log(`✅ Platform: ${analysis.platform}`);
        console.log(`✅ Object Type: ${analysis.objectType}`);
        console.log(`✅ Possible Categories: ${analysis.possibleCategories.join(', ')}`);
        console.log(`✅ Is Private: ${analysis.isPrivate}`);
    } else {
        console.log(`❌ Failed to analyze link`);
    }
}

async function main() {
    console.log('--- Link Analysis Engine Test ---');
    await testAnalysis('https://t.me/durov');
    await testAnalysis('https://t.me/durov/1');
    await testAnalysis('https://vk.com/id1');
    await testAnalysis('https://vk.com/wall1_1');
    await testAnalysis('https://vk.com/club1');
    await testAnalysis('https://www.instagram.com/p/CXYZ123/');
}

main().catch(console.error);

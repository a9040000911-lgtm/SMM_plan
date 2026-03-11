import fs from 'fs';
import { SmartAnalyzerLogic } from '../src/services/providers/smart-analyzer.logic';

async function verifyTelegramMapping() {
    console.log('--- Starting Telegram Mapping Verification v2 ---');
    const dataPath = 'd:/Smmplan/tmp/vexboost_tg_analysis.json';

    if (!fs.existsSync(dataPath)) {
        console.error('Analysis data not found. Run extract-telegram-services.ts first.');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const services = data.services;

    let passed = 0;
    let failed = 0;
    const failures = [];

    for (const s of services) {
        const result = SmartAnalyzerLogic.detectSync(s.name, s.description || '', s.category);

        let isValid = true;
        const n = s.name.toLowerCase();
        const c = s.category.toLowerCase();

        // Define expected target type based on name and category
        let expected: string[] = [];

        if (n.includes('stars') || n.includes('звезд') || c.includes('stars')) {
            expected = ['TG_STARS'];
        } else if (n.includes('буст') || n.includes('boost') || c.includes('буст') || c.includes('boost')) {
            expected = ['TG_BOOST'];
        } else if (n.includes('истори') || n.includes('story') || n.includes('stories')) {
            expected = ['TG_STORY'];
        } else if (n.includes('подпис') || n.includes('участник') || n.includes('фолловер') || n.includes('member') || n.includes('subscriber')) {
            expected = ['TG_CHANNEL'];
        } else if (n.includes('старт') || n.includes('запуск') || n.includes('start') || n.includes('бот') || n.includes('bot') || n.includes('активнос') || c.includes('активнос')) {
            expected = ['TG_BOT'];
        } else if (n.includes('реакци') || n.includes('reaction') || n.includes('👍') || c.includes('реакци')) {
            expected = ['TG_POST'];
        } else if (n.includes('просмотр') || n.includes('view') || n.includes('eye') || c.includes('просмотр')) {
            expected = ['TG_POST', 'CHANNEL_POSTS'];
        } else {
            expected = ['TG_CHANNEL', 'TG_POST', 'TG_BOT'];
        }

        if (expected.includes(result.targetType)) {
            passed++;
        } else {
            failed++;
            failures.push({
                name: s.name,
                category: s.category,
                got: result.targetType,
                expected: expected.join(' or ')
            });
        }
    }

    console.log(`\n--- Verification Summary ---`);
    console.log(`Total Services: ${services.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        console.log('\n--- Failures (Top 20) ---');
        failures.slice(0, 20).forEach(f => {
            console.log(`❌ "${f.name}" (${f.category}) -> Got ${f.got}, Expected ${f.expected}`);
        });
        process.exit(1);
    } else {
        console.log('\n✅ 100% Accuracy achieved for Telegram services!');
    }
}

verifyTelegramMapping().catch(console.error);

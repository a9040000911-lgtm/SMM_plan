import { SmartAnalyzerLogic } from '../src/services/providers/smart-analyzer.logic';

async function testDetector() {
    const testCases = [
        {
            name: "Instagram [ID: 1] 1000 Saves [Fast]",
            description: "Fast delivery, no drop",
            expectedCategory: 'SAVES',
            expectedTarget: 'POST'
        },
        {
            name: "Telegram Members (Real)",
            description: "High quality users",
            expectedCategory: 'SUBSCRIBERS',
            expectedTarget: 'TG_CHANNEL'
        },
        {
            name: "TG Story Views",
            description: "",
            expectedCategory: 'STORIES',
            expectedTarget: 'TG_STORY'
        },
        {
            name: "VK Play Стрим зрители",
            description: "Зрители на стрим вк плей",
            expectedCategory: 'VIEWS', // or STREAMS/OTHER depending on logic
            expectedTarget: 'VK_PLAY_LIVE'
        },
        {
            name: "Telegram Referral Bot Start",
            description: "Start your bot with our users",
            expectedCategory: 'REFERRALS',
            expectedTarget: 'TG_BOT'
        },
        {
            name: "Telegram Stars [Cheap]",
            description: "Cheap stars for your bot",
            expectedCategory: 'STARS',
            expectedTarget: 'TG_STARS'
        }
    ];

    console.log("Starting Smart Import Logic Tests...\n");
    let passed = 0;

    for (const test of testCases) {
        const result = SmartAnalyzerLogic.detectSync(test.name, test.description);
        const catMatch = result.category === test.expectedCategory;
        const targetMatch = result.targetType === test.expectedTarget;

        if (catMatch && targetMatch) {
            console.log(`✅ [PASS] "${test.name}" -> Cat: ${result.category}, Target: ${result.targetType}`);
            passed++;
        } else {
            console.log(`❌ [FAIL] "${test.name}"`);
            console.log(`   Expected: Cat=${test.expectedCategory}, Target=${test.expectedTarget}`);
            console.log(`   Got:      Cat=${result.category}, Target=${result.targetType}`);
        }
    }

    console.log(`\nTests finished. Passed ${passed}/${testCases.length}`);
    process.exit(passed === testCases.length ? 0 : 1);
}

testDetector().catch(err => {
    console.error(err);
    process.exit(1);
});

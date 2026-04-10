/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { SmartAnalyzerLogic } from '../src/services/providers/smart-analyzer.logic';

const TEST_CASES = [
    {
        name: 'Instagram Followers [High Quality] [Instant]',
        category: 'Instagram - Followers',
        expectedPlatform: 'INSTAGRAM',
        expectedCategory: 'SUBSCRIBERS',
        expectedTarget: 'PROFILE'
    },
    {
        name: 'Telegram Post Views + Reactions',
        category: 'Telegram',
        expectedPlatform: 'TELEGRAM',
        expectedCategory: 'VIEWS', // Views is usually first in these cases
        expectedTarget: 'POST'
    },
    {
        name: 'Facebook Group Members [Real Profiles]',
        category: 'Facebook',
        expectedPlatform: 'FACEBOOK',
        expectedCategory: 'SUBSCRIBERS',
        expectedTarget: 'CHANNEL'
    },
    {
        name: 'Threads Post Likes [HQ]',
        category: 'Threads',
        expectedPlatform: 'THREADS',
        expectedCategory: 'LIKES',
        expectedTarget: 'POST'
    },
    {
        name: 'Reddit Subreddit Subscribers',
        category: 'Reddit',
        expectedPlatform: 'REDDIT',
        expectedCategory: 'SUBSCRIBERS',
        expectedTarget: 'CHANNEL'
    },
    {
        name: 'Rutube Video Views [No Drop]',
        category: 'Rutube',
        expectedPlatform: 'RUTUBE',
        expectedCategory: 'VIEWS',
        expectedTarget: 'VIDEO'
    },
    {
        name: 'LinkedIn Company Followers',
        category: 'LinkedIn - Corporate',
        expectedPlatform: 'LINKEDIN',
        expectedCategory: 'SUBSCRIBERS',
        expectedTarget: 'CHANNEL'
    },
    {
        name: 'Просмотры [Подписка 50 постов]',
        category: 'Telegram - Просмотры',
        expectedPlatform: 'TELEGRAM',
        expectedCategory: 'VIEWS',
        expectedTarget: 'CHANNEL_POSTS'
    },
    {
        name: 'YouTube Views via Telegram Ads',
        category: 'YouTube - Views',
        expectedPlatform: 'YOUTUBE',
        expectedCategory: 'VIEWS',
        expectedTarget: 'VIDEO'
    },
    {
        name: 'Instagram Likes [Auto-Subscription]',
        category: 'Instagram',
        expectedPlatform: 'INSTAGRAM',
        expectedCategory: 'LIKES',
        expectedTarget: 'CHANNEL_POSTS'
    }
];

function runTests() {
    console.log('🧠 Testing Smart Service Analyzer...\n');
    let passed = 0;

    for (const test of TEST_CASES) {
        const result = SmartAnalyzerLogic.detectSync(test.name, '', test.category);
        
        const platMatch = result.platform === test.expectedPlatform;
        const catMatch = result.category === test.expectedCategory;
        const targetMatch = result.targetType === test.expectedTarget;

        if (platMatch && catMatch && targetMatch) {
            console.log(`✅ PASS: "${test.name}"`);
            passed++;
        } else {
            console.log(`❌ FAIL: "${test.name}"`);
            if (!platMatch) console.log(`   Platform: expected ${test.expectedPlatform}, got ${result.platform}`);
            if (!catMatch) console.log(`   Category: expected ${test.expectedCategory}, got ${result.category}`);
            if (!targetMatch) console.log(`   TargetType: expected ${test.expectedTarget}, got ${result.targetType}`);
        }
    }

    console.log(`\n📊 Final Result: ${passed}/${TEST_CASES.length} tests passed.`);
}

runTests();

/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { analyzeLink } from '../src/utils/link-analyzer/index';

const TEST_CASES = [
    // Facebook
    { url: 'https://facebook.com/zuck', expectedPlatform: 'FACEBOOK', expectedObject: 'FB_PROFILE' },
    { url: 'https://fb.com/profile.php?id=1000', expectedPlatform: 'FACEBOOK', expectedObject: 'FB_PROFILE' },
    { url: 'https://www.facebook.com/posts/123456', expectedPlatform: 'FACEBOOK', expectedObject: 'FB_POST' },
    { url: 'https://facebook.com/story.php?story_fbid=123&id=456', expectedPlatform: 'FACEBOOK', expectedObject: 'FB_POST' },
    { url: 'https://facebook.com/watch/?v=123', expectedPlatform: 'FACEBOOK', expectedObject: 'FB_POST' },
    { url: 'https://facebook.com/groups/smmplan', expectedPlatform: 'FACEBOOK', expectedObject: 'FB_PROFILE' },
    
    // Reddit
    { url: 'https://reddit.com/r/programming', expectedPlatform: 'REDDIT', expectedObject: 'RD_SUBREDDIT' },
    { url: 'https://reddit.com/u/spez', expectedPlatform: 'REDDIT', expectedObject: 'RD_USER' },
    { url: 'https://reddit.com/r/programming/comments/abc/title/', expectedPlatform: 'REDDIT', expectedObject: 'RD_POST' },

    // LinkedIn
    { url: 'https://linkedin.com/in/williamhgates', expectedPlatform: 'LINKEDIN', expectedObject: 'LI_PROFILE' },
    { url: 'https://linkedin.com/company/google', expectedPlatform: 'LINKEDIN', expectedObject: 'LI_COMPANY' },
    { url: 'https://www.linkedin.com/posts/activity-72813-12', expectedPlatform: 'LINKEDIN', expectedObject: 'LI_POST' },

    // Threads
    { url: 'https://threads.net/@zuck', expectedPlatform: 'THREADS', expectedObject: 'TH_PROFILE' },
    { url: 'https://threads.com/@zuck', expectedPlatform: 'THREADS', expectedObject: 'TH_PROFILE' },
    { url: 'https://www.threads.net/@user/post/C_abc', expectedPlatform: 'THREADS', expectedObject: 'TH_POST' },

    // Rutube
    { url: 'https://rutube.ru/video/abcdef/', expectedPlatform: 'RUTUBE', expectedObject: 'RT_VIDEO' },
    { url: 'https://rutube.ru/shorts/xyz123/', expectedPlatform: 'RUTUBE', expectedObject: 'RT_VIDEO' },
    { url: 'https://rutube.ru/channel/12345/', expectedPlatform: 'RUTUBE', expectedObject: 'RT_CHANNEL' },
    { url: 'https://rutube.ru/plst/999/', expectedPlatform: 'RUTUBE', expectedObject: 'RT_VIDEO' },

    // Dzen
    { url: 'https://dzen.ru/id/12345', expectedPlatform: 'DZEN', expectedObject: 'DZ_CHANNEL' },
    { url: 'https://dzen.ru/@artem', expectedPlatform: 'DZEN', expectedObject: 'DZ_CHANNEL' },
    { url: 'https://dzen.ru/a/xyz-abc', expectedPlatform: 'DZEN', expectedObject: 'DZ_ARTICLE' },
    { url: 'https://dzen.ru/video/watch/id123', expectedPlatform: 'DZEN', expectedObject: 'DZ_VIDEO' },
];

async function runTests() {
    console.log('🧪 Running Deep Analysis Tests for Link Parsers...\n');
    let passed = 0;

    for (const test of TEST_CASES) {
        let result;
        try {
            result = analyzeLink(test.url);
        } catch (e) {
            console.log(`💥 CRASH [${test.expectedPlatform}]: ${test.url}`);
            continue;
        }

        if (result && result.platform === test.expectedPlatform && result.objectType === test.expectedObject) {
            console.log(`✅ [${test.expectedPlatform}] PASS: ${test.url}`);
            passed++;
        } else {
            console.log(`❌ [${test.expectedPlatform}] FAIL: ${test.url}`);
            console.log(`   Expected: ${test.expectedPlatform} / ${test.expectedObject}`);
            console.log(`   Got: ${result?.platform} / ${result?.objectType}`);
        }
    }

    console.log(`\n📊 Final Result: ${passed}/${TEST_CASES.length} tests passed.`);
    process.exit(passed === TEST_CASES.length ? 0 : 1);
}

runTests();

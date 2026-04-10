
import { LinkService } from '../src/services/providers/link.service';
import { Platform } from '@prisma/client';

async function testValidator() {
    console.log('🧪 Starting Link Validator Test...\n');

    const testCases = [
        {
            name: 'Valid Telegram Channel',
            link: 'https://t.me/durov',
            platform: 'TELEGRAM' as Platform,
            target: 'CHANNEL',
            expected: true
        },
        {
            name: 'Invalid Platform (TG link for IG service)',
            link: 'https://t.me/durov',
            platform: 'INSTAGRAM' as Platform,
            target: 'PROFILE',
            expected: false
        },
        {
            name: 'Valid Instagram Post',
            link: 'https://www.instagram.com/p/CXYZ123/',
            platform: 'INSTAGRAM' as Platform,
            target: 'POST',
            expected: true
        },
        {
            name: 'Invalid Target Type (Post link for Channel service)',
            link: 'https://t.me/durov/1234',
            platform: 'TELEGRAM' as Platform,
            target: 'CHANNEL',
            expected: false
        },
        {
            name: 'Valid VK Video',
            link: 'https://vk.com/video-123_456',
            platform: 'VK' as Platform,
            target: 'VIDEO',
            expected: true
        }
    ];

    let passed = 0;
    for (const tc of testCases) {
        const result = LinkService.validate(tc.link, tc.platform, tc.target);
        const isOk = result.isValid === tc.expected;

        console.log(`${isOk ? '✅' : '❌'} ${tc.name}`);
        if (!isOk) {
            console.log(`   Expected: ${tc.expected}, Got: ${result.isValid}`);
            console.log(`   Error message: ${result.error}`);
        } else if (!result.isValid) {
            console.log(`   Blocked correctly: ${result.error}`);
        }
        if (isOk) passed++;
    }

    console.log(`\n📊 Result: ${passed}/${testCases.length} tests passed.`);
}

testValidator().catch(console.error);

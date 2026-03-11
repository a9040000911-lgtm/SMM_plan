import { LinkService } from '../src/services/providers/link.service';
import { Platform } from '@prisma/client';

console.log('Testing Multi-Target Validation Logic...\n');

const vkService = {
    platform: 'VK' as Platform,
    targetType: 'POST',
    allowedTargetTypes: ['ALBUM', 'PHOTO']
};

const testCases = [
    {
        link: 'https://vk.com/wall-12345_6789',
        description: 'VK Post (Primary Target)',
        shouldBeValid: true
    },
    {
        link: 'https://vk.com/album-12345_6789',
        description: 'VK Album (Allowed Target)',
        shouldBeValid: true
    },
    {
        link: 'https://vk.com/photo-12345_6789',
        description: 'VK Photo (Allowed Target)',
        shouldBeValid: true
    },
    {
        link: 'https://t.me/durov/1',
        description: 'Telegram Post (Wrong Platform)',
        shouldBeValid: false
    },
    {
        link: 'https://vk.com/video-123_456',
        description: 'VK Video (Not allowed target)',
        shouldBeValid: false
    }
];

let allPassed = true;

testCases.forEach(test => {
    const result = LinkService.validate(test.link, vkService.platform, vkService.targetType, vkService.allowedTargetTypes);
    const passed = result.isValid === test.shouldBeValid;

    if (!passed) allPassed = false;

    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${test.description}`);
    console.log(`  Link: ${test.link}`);
    console.log(`  Expected: ${test.shouldBeValid}, Got: ${result.isValid}`);
    if (!result.isValid) {
        console.log(`  Error message: ${result.error}`);
    }
    console.log('---');
});

if (allPassed) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}

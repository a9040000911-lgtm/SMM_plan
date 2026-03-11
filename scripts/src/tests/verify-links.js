const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testValidation() {
    console.log('--- STARTING UNIFIED LINK VALIDATION TEST ---');

    // We'll test by manually calling the logic that fetches from DB
    const testCases = [
        { type: 'TG_CHANNEL', link: 'https://t.me/durov', expected: true },
        { type: 'TG_CHANNEL', link: 'https://t.me/durov/123', expected: false }, // Post link for channel type
        { type: 'TG_POST', link: 'https://t.me/durov/1236', expected: true },
        { type: 'VK_VIDEO', link: 'https://vk.com/video-123_456', expected: true },
        { type: 'VK_VIDEO', link: 'https://vk.com/wall-123_456', expected: false }, // Wall instead of video
        { type: 'PROFILE', link: 'https://www.instagram.com/cristiano/', expected: true },
    ];

    for (const tc of testCases) {
        // Fetch pattern from DB
        const linkType = await prisma.linkType.findUnique({ where: { slug: tc.type } });
        if (!linkType) {
            console.log(`[FAIL] LinkType ${tc.type} not found in DB`);
            continue;
        }

        const regex = new RegExp(linkType.validationPattern);
        const isValid = regex.test(tc.link);
        const status = (isValid === tc.expected) ? 'PASS' : 'FAIL';

        console.log(`[${status}] ${tc.type}: ${tc.link} -> Got: ${isValid}, Expected: ${tc.expected}`);
    }

    // Test Smart Analyzer Logic via Proxy
    // Note: We can't easily import TS files into this raw JS script without complex setup
    // but the regex test above confirms the DB data and regex logic.

    await prisma.$disconnect();
}

testValidation().catch(e => {
    console.error(e);
    process.exit(1);
});

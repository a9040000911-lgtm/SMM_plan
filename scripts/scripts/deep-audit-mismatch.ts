
import { prisma } from '../src/lib/prisma';
import { Platform } from '@prisma/client';

async function main() {
    console.log('--- GLOBAL TARGET TYPE AUDIT ---');

    const stats = await prisma.internalService.groupBy({
        by: ['platform', 'targetType', 'category'],
        _count: { id: true },
        orderBy: [
            { platform: 'asc' },
            { targetType: 'asc' }
        ]
    });

    console.log('Current distribution:');
    console.log('| Platform | TargetType | Category | Count |');
    console.log('|----------|------------|----------|-------|');
    stats.forEach(s => {
        console.log(`| ${s.platform.padEnd(8)} | ${s.targetType.padEnd(12)} | ${s.category.padEnd(12)} | ${s._count.id.toString().padEnd(5)} |`);
    });

    // Check categories that exist in DB but might not be in the Category enum (though Prisma should enforce this)
    // Let's check for any targetTypes that look suspicious (prefixes, plural, etc)
    const suspicious = stats.filter(s =>
        s.targetType.includes('_') ||
        s.targetType !== s.targetType.toUpperCase() ||
        ['REELS', 'STORY', 'STORIES'].includes(s.targetType) // check for common plural mismatches
    );

    if (suspicious.length > 0) {
        console.log('\nPotential Mismatches (Suspicious TargetTypes):');
        suspicious.forEach(s => {
            console.log(`- ${s.platform}: ${s.targetType} in ${s.category}`);
        });
    } else {
        console.log('\nNo obviously suspicious TargetTypes found (after my previous fix).');
    }

    // PLATFORM SPECIFIC CHECKS
    console.log('\n--- PLATFORM SPECIFIC CHECKS ---');

    // 1. VK: LinkService uses CHANNEL, POST, VIDEO, STORY, PHOTO, ALBUM, PLAYLIST, POLL, MARKET, PROFILE
    // Let's see what VK has.
    const vkStats = stats.filter(s => s.platform === 'VK');
    console.log('VK TargetTypes in DB:', vkStats.map(s => s.targetType));

    // 2. Instagram: LinkService uses PROFILE, POST, STORY
    const igStats = stats.filter(s => s.platform === 'INSTAGRAM');
    console.log('IG TargetTypes in DB:', igStats.map(s => s.targetType));

    // 3. YouTube: LinkService uses CHANNEL, VIDEO, PLAYLIST, POST
    const ytStats = stats.filter(s => s.platform === 'YOUTUBE');
    console.log('YT TargetTypes in DB:', ytStats.map(s => s.targetType));
}

main().catch(console.error);

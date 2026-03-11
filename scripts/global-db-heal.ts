
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('--- GLOBAL DATABASE HEALING: TARGET TYPES ---');

    // 1. Instagram Cleanup: Normalize everything to POST (LinkService uses POST for Reels and Posts)
    const igResult = await prisma.internalService.updateMany({
        where: {
            platform: 'INSTAGRAM',
            targetType: { in: ['REELS', 'VIDEO', 'REEL'] }
        },
        data: { targetType: 'POST' }
    });
    console.log(`- Instagram: Normalized ${igResult.count} services to POST`);

    // 2. TikTok Cleanup: Normalize non-profile/non-follower services to VIDEO
    const ttResult = await prisma.internalService.updateMany({
        where: {
            platform: 'TIKTOK',
            targetType: 'POST',
            category: { notIn: ['SUBSCRIBERS', 'REFERRALS'] }
        },
        data: { targetType: 'VIDEO' }
    });
    console.log(`- TikTok: Normalized ${ttResult.count} services to VIDEO`);

    // 3. YouTube Cleanup: Normalize to VIDEO
    const ytResult = await prisma.internalService.updateMany({
        where: {
            platform: 'YOUTUBE',
            targetType: 'POST'
        },
        data: { targetType: 'VIDEO' }
    });
    console.log(`- YouTube: Normalized ${ytResult.count} services to VIDEO`);

    // 4. Fix that weird TikTok/Twitter mismatch I saw
    // Name: "Twitter Просмотры на твит/видео [Без списаний]" in TikTok platform
    const twitterInTikTok = await prisma.internalService.updateMany({
        where: {
            platform: 'TIKTOK',
            name: { contains: 'Twitter', mode: 'insensitive' }
        },
        data: { platform: 'TWITTER' }
    });
    console.log(`- Platform Fix: Moved ${twitterInTikTok.count} Twitter services from TikTok platform`);

    // 5. General Pluralization/Case Cleanup
    const cleanup = await prisma.internalService.updateMany({
        where: {
            targetType: { in: ['POS', 'POSTS', 'CHANNELS', 'PROFILES', 'VIDEOS'] }
        },
        data: { targetType: 'POST' } // This is a bit risky but usually these are typos from provider data
    });
    // More specific cleanup
    await prisma.internalService.updateMany({ where: { targetType: 'CHANNELS' }, data: { targetType: 'CHANNEL' } });
    await prisma.internalService.updateMany({ where: { targetType: 'PROFILES' }, data: { targetType: 'PROFILE' } });
    await prisma.internalService.updateMany({ where: { targetType: 'VIDEOS' }, data: { targetType: 'VIDEO' } });

    console.log('\n--- VERIFYING FINAL DISTRIBUTION ---');
    const stats = await prisma.internalService.groupBy({
        by: ['platform', 'targetType'],
        _count: { id: true }
    });
    stats.forEach(s => {
        console.log(`${s.platform}: ${s.targetType} (${s._count.id})`);
    });

    console.log('\n✅ Global Healing Finished.');
}

main().catch(console.error);

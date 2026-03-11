import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('🔄 Normalizing TargetTypes to supported enum values...');

    const services = await prisma.internalService.findMany();
    let count = 0;

    for (const s of services) {
        let newTarget = s.targetType;

        // Mapping overly specific AI types to standard LinkService TargetType
        if (newTarget === 'TG_CHANNEL') newTarget = 'CHANNEL';
        if (newTarget === 'TG_POST') newTarget = 'POST';
        if (newTarget === 'VK_PROFILE') newTarget = 'CHANNEL'; // LinkService.ts:41
        if (newTarget === 'VK_GROUP') newTarget = 'CHANNEL';   // LinkService.ts:42
        if (newTarget === 'VK_VIDEO') newTarget = 'VK_VIDEO';  // Already supported
        if (newTarget === 'VK_CLIP') newTarget = 'VK_CLIP';    // Already supported
        if (newTarget === 'VK_WALL') newTarget = 'POST';       // LinkService.ts:43
        if (newTarget === 'VK_PLAY_LIVE') newTarget = 'VIDEO';
        if (newTarget === 'VK_POLL') newTarget = 'POLL';
        if (newTarget === 'VK_PLAYLIST') newTarget = 'PLAYLIST';
        if (newTarget === 'CHANNEL_POSTS') newTarget = 'CHANNEL_POSTS'; // Supported

        // Fallback for any other weird types
        const supportedTypes = [
            'POST', 'CHANNEL', 'PROFILE', 'VIDEO', 'PHOTO',
            'ALBUM', 'PLAYLIST', 'CHANNEL_POSTS', 'STORY',
            'POLL', 'MARKET', 'EXTERNAL', 'CUSTOM', 'INVITE',
            'VK_VIDEO', 'VK_CLIP'
        ];

        if (!supportedTypes.includes(newTarget)) {
            console.log(`⚠️ Unrecognized type ${newTarget} for ${s.id}, falling back to CHANNEL`);
            newTarget = 'CHANNEL';
        }

        if (newTarget !== s.targetType) {
            console.log(`Updating ${s.id}: ${s.targetType} -> ${newTarget}`);
            await prisma.internalService.update({
                where: { id: s.id },
                data: { targetType: newTarget }
            });
            count++;
        }
    }

    console.log(`✅ Normalized ${count} services.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

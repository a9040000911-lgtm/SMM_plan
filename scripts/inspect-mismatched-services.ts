
import { prisma } from '../src/lib/prisma';

async function main() {
    const tiktokServices = await prisma.internalService.findMany({
        where: { platform: 'TIKTOK' }
    });

    console.log('TikTok Services in DB:');
    tiktokServices.forEach(s => {
        console.log(`- ID: ${s.id}, Name: ${s.name}, targetType: ${s.targetType}`);
    });

    const instagramServices = await prisma.internalService.findMany({
        where: { platform: 'INSTAGRAM' }
    });

    console.log('\nInstagram Services in DB:');
    instagramServices.forEach(s => {
        console.log(`- ID: ${s.id}, Name: ${s.name}, targetType: ${s.targetType}`);
    });
}

main().catch(console.error);

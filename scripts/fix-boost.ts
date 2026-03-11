import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const boosts = await prisma.internalService.findMany({
        where: { category: 'BOOSTS' }
    });
    console.log('Found Boosts:', boosts.length);
    for (const b of boosts) {
        if (b.targetType !== 'CHANNEL') {
            await prisma.internalService.update({
                where: { id: b.id },
                data: { targetType: 'CHANNEL' }
            });
            console.log(`Updated ${b.id} to CHANNEL`);
        } else {
            console.log(`${b.id} already CHANNEL`);
        }
    }
}

main().catch(console.error).finally(() => process.exit(0));

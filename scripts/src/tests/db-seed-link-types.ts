import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
    try {
        console.log("Seeding LinkTypes...");

        const linkTypes = [
            {
                slug: 'VK_GIFT',
                name: 'VK Подарки',
                platform: 'VK',
                keywords: ['подарк', 'gift']
            },
            {
                slug: 'TG_REACTION_PAID',
                name: 'Платные реакции TG',
                platform: 'TELEGRAM',
                keywords: ['платн', 'paid', 'звезд']
            }
        ];

        for (const lt of linkTypes) {
            // @ts-ignore
            await prisma.linkType.upsert({
                where: { slug: lt.slug },
                update: lt,
                create: lt
            });
            console.log(`- Seeded ${lt.slug}`);
        }

        console.log("Seeding complete.");
    } catch (e) {
        console.error("Seeding failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

seed();

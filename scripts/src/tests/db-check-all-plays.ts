import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllPlays() {
    try {
        const playServices = await prisma.internalService.findMany({
            where: { category: 'PLAYS' },
            select: { name: true, platform: true, targetType: true, categoryId: true }
        });

        console.log(`Found ${playServices.length} total services in 'PLAYS' category:`);
        for (const s of playServices) {
            console.log(`- [${s.platform}] "${s.name}": Target=${s.targetType}, CategoryID=${s.categoryId}`);
        }

        const playCategories = await prisma.serviceCategory.findMany({
            where: { categoryType: 'PLAYS' }
        });

        console.log(`\n'PLAYS' Categories in DB:`);
        for (const c of playCategories) {
            console.log(`- ID: ${c.id}, Platform: ${c.platform}, Name: ${c.name}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkAllPlays();

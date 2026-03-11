import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
    try {
        const vkServices = await prisma.internalService.findMany({
            where: { platform: 'VK' },
            select: { name: true, category: true, targetType: true, categoryId: true }
        });

        console.log(`Found ${vkServices.length} VK services:`);
        for (const s of vkServices) {
            console.log(`- "${s.name}": Category=${s.category}, TargetType=${s.targetType}, CategoryID=${s.categoryId}`);
        }

        const playCategories = await prisma.serviceCategory.findMany({
            where: { categoryType: 'PLAYS' },
            include: { _count: { select: { internalServices: true } } }
        });

        console.log(`\n'PLAYS' Categories in DB:`);
        for (const c of playCategories) {
            console.log(`- ID: ${c.id}, Platform: ${c.platform}, Name: ${c.name}, Services: ${c._count.internalServices}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();

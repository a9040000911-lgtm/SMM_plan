import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
    try {
        const playsCategories = await prisma.serviceCategory.findMany({
            where: { categoryType: 'PLAYS' },
            include: { _count: { select: { internalServices: true } } }
        });

        console.log(`Found ${playsCategories.length} categories of type 'PLAYS':`);
        for (const c of playsCategories) {
            console.log(`- ID: ${c.id}, Name: "${c.name}", Platform: ${c.platform}, Services: ${c._count.internalServices}`);
        }

        const playsServices = await prisma.internalService.findMany({
            where: { category: 'PLAYS' }
        });
        console.log(`\nFound ${playsServices.length} services with category 'PLAYS'.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

verify();

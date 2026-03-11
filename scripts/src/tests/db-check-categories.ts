import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCategories() {
    try {
        const categories = await prisma.serviceCategory.findMany({
            include: {
                _count: {
                    select: { services: true }
                }
            }
        });

        console.log("Current Categories and Service Counts:");
        for (const cat of categories) {
            console.log(`- [${cat.platform}] ${cat.categoryType} (${cat.targetType}): ${cat._count.services} services`);
        }

        const miscategorized = await prisma.internalService.findMany({
            where: {
                platform: 'VK',
                category: 'PLAYS',
                OR: [
                    { name: { contains: 'просмотр', mode: 'insensitive' } },
                    { name: { contains: 'глазик', mode: 'insensitive' } },
                    { name: { contains: 'охват', mode: 'insensitive' } }
                ]
            },
            select: { id: true, name: true, category: true }
        });

        console.log(`\nFound ${miscategorized.length} potentially miscategorized VK services in 'PLAYS':`);
        for (const s of miscategorized) {
            console.log(`- ${s.name} (ID: ${s.id})`);
        }

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCategories();

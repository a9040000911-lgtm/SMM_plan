import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCategoryNames() {
    try {
        const ids = [
            '1a8fe521-485b-41db-948d-3cd06981048e',
            '5e41a5fe-fe57-431f-aebe-980da41bc078',
            'f20e235d-4157-4c42-a7bb-5ebadde459e1'
        ];

        const categories = await prisma.serviceCategory.findMany({
            where: { id: { in: ids } }
        });

        console.log("Category Details:");
        for (const c of categories) {
            console.log(`- ID: ${c.id}, Name: "${c.name}", Type: ${c.categoryType}, Platform: ${c.platform}, Target: ${c.targetType}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkCategoryNames();

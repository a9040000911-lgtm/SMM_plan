import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const services = await prisma.providerService.findMany({
        where: {
            platform: 'VK',
            category: {
                in: ['SUBSCRIBERS', 'FRIENDS', 'GROUPS', 'OTHER']
            }
        },
        select: {
            id: true,
            name: true,
            platform: true,
            category: true
        }
    });

    console.log(JSON.stringify(services, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const serviceId = 1797;
    const service = await prisma.providerService.findFirst({
        where: { id: serviceId },
        select: { id: true, name: true, category: true, rawData: true }
    });

    if (service) {
        console.log(JSON.stringify(service, null, 2));
    } else {
        console.log(`Service ${serviceId} not found`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());

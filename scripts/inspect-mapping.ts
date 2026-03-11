
import { prisma } from '../src/lib/prisma';

async function main() {
    const serviceId = process.argv[2];
    if (!serviceId) {
        console.error('Нужно указать internalServiceId');
        return;
    }

    const mapping = await prisma.internalServiceMapping.findMany({
        where: { internalServiceId: serviceId },
        include: {
            provider: true,
            providerService: true
        }
    });

    console.log(JSON.stringify(mapping, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

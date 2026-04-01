import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function exportFull() {
    console.log('Чтение ProviderService из БД...');
    const services = await prisma.providerService.findMany({
        select: {
            id: true,
            externalId: true,
            name: true,
            rawPriceOriginal: true,
            SocialPlatform: { select: { name: true } },
            ServiceCategory: { select: { name: true } }
        }
    });

    fs.writeFileSync('vexboost_full.json', JSON.stringify(services, null, 2));
    console.log(`Экспортировано ${services.length} услуг Vexboost с remoteId!`);
}

exportFull()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

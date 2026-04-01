import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching descriptions from InternalService...');
    
    const services = await prisma.providerService.findMany({
        select: {
            id: true,
            name: true,
            description: true,
            rawData: true,
            rawPrice: true
        }
    });

    const out = services.map(s => {
        const raw = s.rawData as any;
        return {
            id: s.id,
            name: s.name,
            platform: raw?.analysis?.platform || 'other',
            category: raw?.analysis?.category || 'other',
            price: Number(s.rawPrice),
            description: s.description || ''
        };
    });

    fs.writeFileSync('raw_catalog.json', JSON.stringify(out, null, 2));
    console.log(`✅ Успешно экспортировано ${out.length} услуг в файл raw_catalog.json`);
    console.log(`Отправьте этот файл (или его часть) ИИ-Копирайтеру в чат для переработки.`);
}

main()
    .catch(e => {
        console.error('Ошибка экспорта:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());

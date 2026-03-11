import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/client';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkAll() {
    const services = await prisma.internalService.findMany({
        take: 100,
        orderBy: { pricePer1000: 'desc' },
        select: {
            id: true,
            name: true,
            pricePer1000: true,
            lastProviderPrice: true,
            markup: true
        }
    });
    console.log(JSON.stringify(services, (key, value) => typeof value === 'object' && value && value.constructor && value.constructor.name === 'Decimal' ? value.toString() : value, 2));
}

checkAll().catch(console.error).finally(() => prisma.$disconnect());

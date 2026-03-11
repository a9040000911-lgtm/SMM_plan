import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
    console.log('--- DATABASE AUDIT ---');

    // 1. Check all schemas
    const schemas = await prisma.$queryRaw`SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema'`;
    console.log('Schemas:', schemas);

    // 2. Check counts for ALL tables from public
    const tables = ['Project', 'User', 'InternalService', 'Provider', 'Order', 'Transaction'];
    for (const table of tables) {
        try {
            const count: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "${table}"`);
            console.log(`${table} count:`, count[0].count);
        } catch (e) {
            console.log(`${table} error:`, (e as any).message);
        }
    }

    // 3. Try searching for ANY project without schema filter if possible (if using Raw PG)
}

main().catch(console.error).finally(() => prisma.$disconnect());

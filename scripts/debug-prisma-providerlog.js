const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const path = require('path');
const { PrismaClient } = require(path.join(process.cwd(), 'src/generated/client'));

const connectionString = "postgresql://smmuser:smmpassword@127.0.0.1:5434/smmplan?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function debug() {
    try {
        console.log('Step 1: Simple findMany...');
        await prisma.providerBalanceLog.findMany();
        console.log('✅ PASS');

        console.log('Step 2: select specific fields...');
        await prisma.providerBalanceLog.findMany({ select: { id: true, balance: true } });
        console.log('✅ PASS');

        console.log('Step 3: include provider...');
        await prisma.providerBalanceLog.findMany({ include: { provider: true } });
        console.log('✅ PASS');

    } catch (e) {
        console.error('❌ FAIL at:', e.message);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

debug();

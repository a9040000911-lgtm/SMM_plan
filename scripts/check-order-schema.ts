import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // Check the specific migration record
    const migration = await prisma.$queryRaw`
        SELECT migration_name, started_at, finished_at, applied_steps_count, rolled_back_at, logs
        FROM "_prisma_migrations" 
        WHERE migration_name LIKE '%provider_raw_response%'
    `;
    console.log('=== Migration record for providerRawResponse ===');
    console.log(JSON.stringify(migration, null, 2));

    // Also check if there are any failed migrations at all
    const failed = await prisma.$queryRaw`
        SELECT migration_name, rolled_back_at, logs 
        FROM "_prisma_migrations" 
        WHERE rolled_back_at IS NOT NULL OR logs IS NOT NULL
        LIMIT 10
    `;
    console.log('\n=== Migrations with issues ===');
    console.log(JSON.stringify(failed, null, 2));

    // Count total columns vs expected
    const colCount = await prisma.$queryRaw`
        SELECT count(*) as cnt FROM information_schema.columns WHERE table_name = 'Order'
    `;
    console.log('\nTotal Order columns in DB:', (colCount as any)[0].cnt);

    // Check for other possibly missing columns by comparing schema fields
    const schemaFields = [
        'providerRawResponse', 'warrantyDays', 'managedChannelId', 
        'parentId', 'isManual', 'metadata', 'currentCount', 'initialCount',
        'lastCheckedAt'
    ];
    
    for (const field of schemaFields) {
        const exists = await prisma.$queryRaw`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'Order' AND column_name = ${field}
        `;
        const found = (exists as any[]).length > 0;
        if (!found) {
            console.log(`❌ MISSING: ${field}`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());

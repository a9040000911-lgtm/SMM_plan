import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
    const svcs = await p.internalService.findMany({
        where: { platform: { contains: 'telegram', mode: 'insensitive' } },
        select: { id: true, name: true, category: true, targetType: true },
        orderBy: { category: 'asc' },
    });

    // Group by category
    const grouped = {};
    for (const s of svcs) {
        const cat = s.category || 'UNCATEGORIZED';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(s);
    }

    console.log(`\n=== Telegram Services Audit (${svcs.length} total) ===\n`);
    for (const [cat, services] of Object.entries(grouped)) {
        console.log(`\n--- ${cat} (${services.length}) ---`);
        for (const s of services) {
            console.log(`  [${s.targetType || 'NULL'}] ${s.name}`);
        }
    }

    await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

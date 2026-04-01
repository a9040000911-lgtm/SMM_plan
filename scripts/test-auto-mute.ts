import { PrismaClient } from '@prisma/client';
import { ServiceSyncService } from '../src/services/providers/sync.service';

const prisma = new PrismaClient();

async function run() {
    console.log('--- STARTING RESILIENCE AUTO-MUTE TEST ---');

    let provider = await prisma.provider.findFirst({ where: { name: 'VexBoost Mock' }});
    if (!provider) {
        console.log('Setting up Mock Provider in DB...');
        provider = await prisma.provider.create({
            data: {
                name: 'VexBoost Mock',
                type: 'perfect_panel', // Assume perfect_panel driver works with our mock
                apiUrl: 'http://127.0.0.1:3000/api/dev/mock-provider',
                apiKey: 'TEST_KEY', // Normal mode
                projectId: null
            }
        });
    }

    try {
        // 1. Initial Sync (Normal)
        console.log('\n1. Normal Sync to populate DB...');
        await prisma.provider.update({ where: { id: provider.id }, data: { apiKey: 'TEST_KEY' }});
        await ServiceSyncService.syncProvider(provider.id);
        
        let servicesCount = await prisma.providerService.count({ where: { providerId: provider.id, isActive: true }});
        console.log(`Normal sync completed. Active ProviderServices: ${servicesCount}`);

        // 2. CHAOS DROP Mode (Should trigger Auto-Mute of Telegram orphans)
        console.log('\n2. Triggering CHAOS_DROP (Dropping all Telegram services)...');
        await prisma.provider.update({ where: { id: provider.id }, data: { apiKey: 'MODE:CHAOS_DROP' }});
        await ServiceSyncService.syncProvider(provider.id);
        
        let newCount = await prisma.providerService.count({ where: { providerId: provider.id, isActive: true }});
        let inactiveCount = await prisma.providerService.count({ where: { providerId: provider.id, isActive: false }});
        console.log(`CHAOS_DROP sync completed. Active ProviderServices: ${newCount}, Muted (Orphans): ${inactiveCount}`);
        
        // 3. CHAOS NAME Mode (Should trigger Name Guard)
        console.log('\n3. Triggering CHAOS_NAME (Changing service quality to Bots)...');
        await prisma.provider.update({ where: { id: provider.id }, data: { apiKey: 'MODE:CHAOS_NAME' }});
        await ServiceSyncService.syncProvider(provider.id);
        
        let logs = await prisma.adminLog.findMany({
            where: { action: 'NAME_GUARD' },
            orderBy: { createdAt: 'desc' },
            take: 3
        });
        console.log(`Admin Logs recorded for NAME_GUARD: ${logs.length}`);
        logs.forEach(l => console.log(' -> ' + l.details));

        // 4. Auto-Recover (Normal)
        console.log('\n4. Restoring Normal Mode (Auto-Recover)...');
        await prisma.provider.update({ where: { id: provider.id }, data: { apiKey: 'TEST_KEY' }});
        await ServiceSyncService.syncProvider(provider.id);
        
        let recoveredCount = await prisma.providerService.count({ where: { providerId: provider.id, isActive: true }});
        let recoveredInactiveCount = await prisma.providerService.count({ where: { providerId: provider.id, isActive: false }});
        console.log(`Normal sync completed. Active ProviderServices: ${recoveredCount}, Muted: ${recoveredInactiveCount}`);

    } finally {
        await prisma.$disconnect();
    }
}

run();

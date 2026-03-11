import { prisma } from '../src/lib/prisma';
import { CryptoService } from '../src/services/core/crypto.service';
import { ProviderService } from '../src/services/providers/provider.service';
import { ServiceSyncService } from '../src/services/providers/sync.service';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    const name = 'VexBoost';
    const type = 'vexboost';
    const apiUrl = 'https://vexboost.ru/api/v2';
    const rawApiKey = 'MIdqHiwf1HYo6j6bL4WwyZFygHr5yqTZmGVzQzNJ9T8cSBwNC3ujkbyKhcCT';

    console.log(`[Script] Adding provider: ${name}...`);

    // 1. Encrypt API Key
    const encryptedApiKey = CryptoService.encrypt(rawApiKey);
    console.log(`[Script] API Key encrypted.`);

    // 2. Upsert Provider
    const providerId = 'vexboost';
    const provider = await prisma.provider.upsert({
        where: { id: providerId },
        update: {
            type,
            apiUrl,
            apiKey: encryptedApiKey,
            isEnabled: true,
        },
        create: {
            id: providerId,
            name,
            type,
            apiUrl,
            apiKey: encryptedApiKey,
            isEnabled: true,
            balanceThreshold: 1000,
        },
    });

    console.log(`[Script] Provider ${name} added/updated with ID: ${provider.id}`);

    // 3. Trigger initial sync
    console.log(`[Script] Triggering initial service sync...`);
    try {
        await ServiceSyncService.syncProvider(provider.id);
        console.log(`[Script] Sync completed successfully.`);
    } catch (err: any) {
        console.error(`[Script] Sync failed:`, err.message);
    }

    // Note: We don't call disconnect here as we use the shared instance which might be needed by other stuff if run in dev, 
    // but in a script it's usually fine. However, let's keep it safe.
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

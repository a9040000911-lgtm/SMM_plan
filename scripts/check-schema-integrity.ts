
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('🧪 Checking DB Schema Integrity for all major models...');
    const models = [
        'project', 'user', 'order', 'internalService', 'provider',
        'transaction', 'supportTicket', 'businessExpense', 'serviceCategory',
        'socialPlatform', 'ledgerEntry', 'promoCode', 'news', 'settings'
    ];

    for (const model of models) {
        try {
            console.log(`Checking ${model}...`);
            // @ts-ignore
            await prisma[model].findMany({ take: 1 });
            console.log(`✅ ${model} is OK`);
        } catch (err: any) {
            console.error(`❌ Error in ${model}:`, err.message);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

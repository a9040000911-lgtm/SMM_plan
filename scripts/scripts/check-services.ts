
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
    const count = await prisma.providerService.count();
    console.log(`Provider services in DB: ${count}`);

    if (count > 0) {
        const samples = await prisma.providerService.findMany({ take: 5 });
        console.log('Sample services:', JSON.stringify(samples, null, 2));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());

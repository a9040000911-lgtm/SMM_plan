
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
    const providers = await prisma.provider.findMany();
    console.log('Providers in DB:', JSON.stringify(providers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

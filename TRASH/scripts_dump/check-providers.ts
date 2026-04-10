import { prisma } from '@/lib/prisma';

async function main() {
    const providers = await prisma.provider.findMany({
        include: {
            _count: {
                select: { services: true }
            }
        }
    });

    console.log('--- Active Providers ---');
    if (providers.length === 0) {
        console.log('No providers found. Please add a provider first.');
    } else {
        providers.forEach(p => {
            console.log(`[${p.isEnabled ? 'ACTIVE' : 'DISABLED'}] ID: ${p.id} | Name: ${p.name} | Services: ${p._count.services}`);
            console.log(`API URL: ${p.apiUrl}`);
        });
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

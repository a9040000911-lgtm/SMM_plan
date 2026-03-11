import { prisma } from '../src/lib/prisma';

async function clearAdmins() {
    console.log('--- Clearing Admin Table for Bootstrap ---');

    const deleted = await prisma.user.deleteMany({
        where: {
            role: { in: ['ADMIN', 'SUPPORT', 'SEO'] }
        }
    });

    console.log(`Deleted ${deleted.count} admins.`);
    console.log('Bootstrap mode is now active.');
}

clearAdmins()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

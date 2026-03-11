import { prisma } from '../src/lib/prisma';

async function verifyBootstrap() {
    console.log('--- Bootstrap Verification ---');

    const adminCount = await prisma.user.count({
        where: { role: { in: ['ADMIN', 'SUPPORT', 'SEO'] } }
    });

    console.log(`Current Admin Count: ${adminCount}`);

    if (adminCount === 0) {
        console.log('SUCCESS: System is in Bootstrap Mode. First login will create a Super Admin.');
    } else {
        const admins = await prisma.user.findMany({
            where: { role: { in: ['ADMIN', 'SUPPORT', 'SEO'] } },
            select: { email: true, role: true }
        });
        console.log('Admins already exist:');
        admins.forEach(a => console.log(`- ${a.email} (${a.role})`));
        console.log('NOTE: To test bootstrapping, you would need an empty admin table.');
    }
}

verifyBootstrap()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

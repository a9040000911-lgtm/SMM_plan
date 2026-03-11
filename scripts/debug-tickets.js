
const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();

async function main() {
    const projects = await prisma.project.findMany({
        select: { id: true, name: true, botToken: true }
    });
    console.log('Projects:', projects.map(p => ({
        id: p.id,
        name: p.name,
        hasToken: !!p.botToken
    })));

    const users = await prisma.user.findMany({
        where: { tickets: { some: {} } },
        include: { project: true, tickets: { include: { messages: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 5
    });

    console.log('Users with tickets:');
    users.forEach(u => {
        console.log(`User: ${u.id} | Project: ${u.project?.name || 'Global'} | tgId: ${u.tgId}`);
        u.tickets.forEach(t => {
            console.log(`  Ticket: ${t.id} | Subject: ${t.subject} | Status: ${t.status}`);
            t.messages.forEach(m => {
                console.log(`    [${m.sender}] ${m.text.substring(0, 50)}...`);
            });
        });
    });
}

main().finally(() => prisma.$disconnect());

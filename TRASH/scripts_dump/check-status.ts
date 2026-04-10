
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function check() {
    const projects = await prisma.project.findMany();
    const users = await prisma.user.findMany({
        take: 10,
        select: { id: true, email: true, tgId: true, projectId: true, role: true }
    });
    
    console.log(JSON.stringify({
        projects: projects.map(p => ({ id: p.id, slug: p.slug, domain: p.domain, botToken: p.botToken ? 'SET' : 'MISSING' })),
        users: users.map(u => ({ ...u, tgId: u.tgId?.toString() }))
    }, null, 2));
}
check().finally(() => prisma.$disconnect());

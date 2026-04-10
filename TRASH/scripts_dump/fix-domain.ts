import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const p = await prisma.project.findFirst({
        orderBy: { createdAt: 'asc' }
    });
    if (p) {
        if (p.domain !== 'localhost' && (!p.domain || p.domain === '')) {
            await prisma.project.update({
                where: { id: p.id },
                data: { domain: 'localhost' }
            });
            console.log('Project domain updated to localhost');
        } else {
            console.log('Project domain is already correctly set or non-empty:', p.domain);
        }
    } else {
        console.log('No project found');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());

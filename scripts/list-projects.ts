import { prisma } from '../src/lib/prisma';

async function listAllProjects() {
    console.log('--- All Projects ---');
    const projects = await prisma.project.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
            botToken: true,
            isActive: true,
            createdAt: true
        }
    });

    console.log(JSON.stringify(projects, (key, value) => {
        if (key === 'botToken' && value) {
            if (value.includes(':')) {
                return '[ENCRYPTED] ' + value.substring(0, 10) + '...';
            }
            return '[PLAIN] ' + value.substring(0, 10) + '...';
        }
        return value;
    }, 2));
}

listAllProjects()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

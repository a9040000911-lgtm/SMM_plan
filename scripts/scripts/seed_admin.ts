
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tgId = BigInt('268747191');
    const email = 'infosokoloff@yandex.ru';
    const projectName = 'SmmPlan';
    const projectSlug = 'default';

    console.log(`Starting seeding for project: ${projectName}...`);

    // 1. Rename old project if exists to avoid domain conflict
    const oldProject = await prisma.project.findUnique({ where: { slug: 'smmplan' } });
    if (oldProject) {
        console.log('Renaming old smmplan project to default...');
        await prisma.project.update({
            where: { slug: 'smmplan' },
            data: { slug: 'default' }
        });
    }

    // 1b. Create or get Project
    const project = await prisma.project.upsert({
        where: { slug: projectSlug },
        update: {
            name: projectName,
            domain: 'smmplan.ru'
        },
        create: {
            name: projectName,
            slug: projectSlug,
            domain: 'smmplan.ru',
            brandColor: '#3b82f6',
        },
    });

    console.log(`Project ready: ${project.id}`);

    // 2. Create Superadmin User
    const user = await prisma.user.upsert({
        where: {
            projectId_tgId: {
                projectId: project.id,
                tgId: tgId
            }
        },
        update: {
            role: Role.ADMIN,
            isGlobalAdmin: true,
            email: email,
        },
        create: {
            projectId: project.id,
            tgId: tgId,
            username: 'admin',
            email: email,
            role: Role.ADMIN,
            isGlobalAdmin: true,
            balance: 1000000.00, // Starting balance for admin testing
        },
    });

    console.log(`Superadmin created/updated:`);
    console.log(JSON.stringify({
        id: user.id,
        tgId: user.tgId?.toString() || null,
        role: user.role,
        isGlobalAdmin: user.isGlobalAdmin,
        projectId: user.projectId
    }, null, 2));

    // 3. Link Staff Project relation (optional but good for RBAC)
    await prisma.user.update({
        where: { id: user.id },
        data: {
            accessibleProjects: {
                connect: { id: project.id }
            }
        }
    });

    console.log('Seeding finished successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

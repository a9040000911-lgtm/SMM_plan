import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- SEEDING SETTINGS ---');

    const defaultProject = await prisma.project.findFirst({
        where: { slug: 'default' }
    });

    if (!defaultProject) {
        console.error('Default project not found!');
        return;
    }

    const settings = [
        { key: 'BALANCE_ALERT_MUTED_UNTIL', value: '2020-01-01T00:00:00.000Z', projectId: null },
        { key: 'MIN_MARGIN_PERCENT', value: '15', projectId: defaultProject.id },
        { key: 'MAINTENANCE_MODE', value: 'false', projectId: defaultProject.id },
        { key: 'WELCOME_TEXT', value: '👋 Добро пожаловать в SMMPlan!', projectId: defaultProject.id }
    ];

    for (const s of settings) {
        const existing = await prisma.settings.findFirst({
            where: {
                key: s.key,
                projectId: s.projectId
            }
        });

        if (existing) {
            await prisma.settings.update({
                where: { id: existing.id },
                data: { value: s.value }
            });
        } else {
            await prisma.settings.create({
                data: {
                    key: s.key,
                    value: s.value,
                    projectId: s.projectId
                }
            });
        }
    }

    console.log('✅ Settings seeded successfully');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
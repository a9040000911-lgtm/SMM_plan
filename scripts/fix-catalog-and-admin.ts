import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Starting Diagnostic & Fix Script...');

    // 1. Check Projects
    const projects = await prisma.project.findMany({
        orderBy: { createdAt: 'asc' }
    });

    if (projects.length === 0) {
        console.log('❌ No projects found!');
        return;
    }

    console.log(`Found ${projects.length} projects.`);
    projects.forEach(p => console.log(` - ID: ${p.id}, Slug: ${p.slug}, Domain: ${p.domain}`));

    // The application falls back to the FIRST project if hostname resolution fails
    const activeProject = projects[0];
    console.log(`\n🎯 Target Active Project: ${activeProject.name} (${activeProject.id})`);

    // 2. Fix Categories (ensure they exist for this project)
    const internalServices = await prisma.internalService.findMany({
        include: { serviceCategory: true }
    });
    console.log(`Found ${internalServices.length} internal services.`);

    let overridesCreated = 0;
    for (const service of internalServices) {
        // Ensure ProjectServiceOverride exists
        await prisma.projectServiceOverride.upsert({
            where: {
                projectId_internalServiceId: {
                    projectId: activeProject.id,
                    internalServiceId: service.id
                }
            },
            update: { isActive: true },
            create: {
                projectId: activeProject.id,
                internalServiceId: service.id,
                isActive: true
            }
        });
        overridesCreated++;
    }
    console.log(`✅ Created/Updated ${overridesCreated} ProjectServiceOverrides.`);

    // 3. Create Admin User
    const email = 'admin@smmplan.ru';
    const password = 'adminpassword123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: 'ADMIN',
            isGlobalAdmin: true,
            projectId: activeProject.id
        },
        create: {
            email,
            username: 'admin',
            password: hashedPassword,
            role: 'ADMIN',
            isGlobalAdmin: true,
            projectId: activeProject.id,
            balance: 100000
        }
    });

    console.log(`\n👤 Admin User Created/Updated:`);
    console.log(` - Email: ${email}`);
    console.log(` - Password: ${password}`);
    console.log(` - Project ID: ${admin.projectId}`);

    // 4. Verify Catalog Data
    const visibleServices = await prisma.internalService.count({
        where: {
            projectOverrides: {
                some: { projectId: activeProject.id, isActive: true }
            }
        }
    });
    console.log(`\n📊 Verification: ${visibleServices} services are now visible in the catalog for project ${activeProject.id}.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

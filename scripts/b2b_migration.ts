import { PrismaClient, ProjectRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting B2B Data Migration ---');

  // 1. Извлекаем глобального админа (владельца Smmplan)
  const globalAdmin = await prisma.user.findFirst({ 
    where: { isGlobalAdmin: true },
    orderBy: { createdAt: 'asc' }
  });

  if (!globalAdmin) {
    console.log('No global admin found! Skipping migration (empty database or local dev).');
    return;
  }

  // 2. Создаем или находим дефолтную Организацию
  let defaultOrg = await prisma.organization.findFirst({ 
      where: { name: 'Smmplan Global' }
  });
  
  if (!defaultOrg) {
    defaultOrg = await prisma.organization.create({
      data: {
        name: 'Smmplan Global',
        ownerId: globalAdmin.id,
        masterBalance: 0,
      }
    });
    console.log(`⚡ Created Default Organization: ${defaultOrg.id}`);
  } else {
    console.log('✅ Default Organization already exists.');
  }

  // 3. Привязываем существующие проекты к дефолтной организации (защита null-полей)
  const updateResult = await prisma.project.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id }
  });
  console.log(`⚡ Linked ${updateResult.count} orphaned projects to Default Organization.`);

  // 4. Миграция старых доступов (StaffProjects) во внедренный ProjectMembership
  const usersWithProjects = await prisma.user.findMany({
    where: { accessibleProjects: { some: {} } },
    include: { accessibleProjects: true }
  });

  console.log(`🔍 Found ${usersWithProjects.length} users with existing project access.`);

  let membershipsCreated = 0;
  for (const user of usersWithProjects) {
    // В зависимости от глобального статуса, даем локальную роль
    let targetRole: ProjectRole = 'SUPPORT';
    if (user.role === 'ADMIN') targetRole = 'MANAGER';
    if (user.isGlobalAdmin) targetRole = 'OWNER';

    for (const project of user.accessibleProjects) {
      const existing = await prisma.projectMembership.findUnique({
        where: {
          projectId_userId: { projectId: project.id, userId: user.id }
        }
      });
      
      if (!existing) {
        await prisma.projectMembership.create({
          data: {
            projectId: project.id,
            userId: user.id,
            role: targetRole
          }
        });
        membershipsCreated++;
        console.log(`   + Created ${targetRole} membership for ${user.email} in project: ${project.name}`);
      }
    }
  }
  
  console.log(`⚡ Total Memberships created: ${membershipsCreated}`);
  console.log('--- B2B Data Migration Complete ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

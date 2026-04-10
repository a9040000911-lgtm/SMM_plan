import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Fixing Local Database Project Mapping ---');
  
  // 1. Ищем существующий проект
  let project = await prisma.project.findFirst({
    where: { OR: [
      { slug: 'default' },
      { name: 'Default Project' },
      { slug: '101' }
    ]}
  });

  if (project) {
    await prisma.project.update({
      where: { id: project.id },
      data: { domain: 'localhost' }
    });
    console.log(`✅ Project "${project.name}" (slug: ${project.slug}) is now linked to localhost.`);
  } else {
    project = await prisma.project.create({
      data: {
        name: 'SMM Plan Local',
        slug: 'default',
        domain: 'localhost',
        brandColor: '#3b82f6'
      }
    });
    console.log(`✅ Created new default project for localhost.`);
  }

  // 2. Создаем первого админа, если его нет (для доступа в панель)
  const adminEmail = 'admin@example.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        role: 'ADMIN',
        isGlobalAdmin: true,
        username: 'Local Admin'
      }
    });
    console.log(`✅ Created local admin: ${adminEmail}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

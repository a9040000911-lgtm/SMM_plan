import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const domain = 'localhost';
  const project = await prisma.project.findFirst({
    where: { OR: [{ slug: '101' }, { name: 'SMM Plan' }] }
  });

  if (!project) {
    console.log('Project not found, creating default one...');
    await prisma.project.create({
      data: {
        name: 'SMM Plan',
        slug: '101',
        domain: domain,
        brandColor: '#3b82f6'
      }
    });
  } else {
    await prisma.project.update({
      where: { id: project.id },
      data: { domain: domain }
    });
    console.log(`✅ Project ${project.name} (ID: ${project.id}) linked to ${domain}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING INSTANT ORDER SERVICES (JS) ---');

  // 1. Get Project
  let project = await prisma.project.findFirst({
    where: { OR: [{ slug: 'smmplan' }, { domain: 'localhost:3000' }] }
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Smmplan Local',
        slug: 'smmplan',
        domain: 'localhost:3000',
      }
    });
  }

  // 2. Services Data
  const services = [
    {
      id: 'tg-subs-premium',
      platform: 'TELEGRAM',
      category: 'SUBSCRIBERS',
      name: 'Подписчики (Premium)',
      description: 'Высокое качество, без отписок.',
      pricePer1000: 249,
      minQty: 10,
      maxQty: 50000,
      targetType: 'CHANNEL',
    },
    {
      id: 'tg-views-fast',
      platform: 'TELEGRAM',
      category: 'VIEWS',
      name: 'Просмотры (Быстрые)',
      description: 'Моментальный старт.',
      pricePer1000: 8,
      minQty: 100,
      maxQty: 1000000,
      targetType: 'POST',
    }
  ];

  for (const s of services) {
    await prisma.internalService.upsert({
      where: { id: s.id },
      update: s,
      create: s
    });
    
    await prisma.projectServiceOverride.upsert({
      where: { projectId_internalServiceId: { projectId: project.id, internalServiceId: s.id } },
      update: { isActive: true },
      create: { projectId: project.id, internalServiceId: s.id, isActive: true }
    });
    console.log('Seeded:', s.name);
  }

  console.log('--- COMPLETE ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());

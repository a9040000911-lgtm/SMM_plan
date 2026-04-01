import { PrismaClient, ServiceType } from '@prisma/client';
import { Platform, Category } from '../services/types';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING INSTANT ORDER SERVICES ---');

  // 1. Get or Create Project
  let project = await prisma.project.findFirst({
    where: { OR: [{ slug: 'smmplan' }, { domain: 'localhost:3000' }] }
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Smmplan Local',
        slug: 'smmplan',
        domain: 'localhost:3000',
        brandColor: '#3b82f6',
      }
    });
    console.log('Created local project:', project.id);
  }

  // 2. Create Services
  const servicesData = [
    {
      id: 'tg-subs-high',
      platform: Platform.TELEGRAM,
      category: Category.SUBSCRIBERS,
      name: 'Подписчики (Высокое качество)',
      description: 'Живые подписчики с гарантией 30 дней.',
      pricePer1000: 149.00,
      minQty: 10,
      maxQty: 50000,
      targetType: 'CHANNEL',
      geo: 'RU',
      isActive: true,
      type: ServiceType.REGULAR
    },
    {
      id: 'tg-subs-standard',
      platform: Platform.TELEGRAM,
      category: Category.SUBSCRIBERS,
      name: 'Подписчики (Стандарт)',
      description: 'Быстрый старт, низкая цена.',
      pricePer1000: 89.00,
      minQty: 100,
      maxQty: 100000,
      targetType: 'CHANNEL',
      geo: 'MIX',
      isActive: true,
      type: ServiceType.REGULAR
    },
    {
      id: 'tg-views-real',
      platform: Platform.TELEGRAM,
      category: Category.VIEWS,
      name: 'Просмотры (Real)',
      description: 'Просмотры на последний пост.',
      pricePer1000: 5.50,
      minQty: 500,
      maxQty: 1000000,
      targetType: 'POST',
      geo: 'GLOBAL',
      isActive: true,
      type: ServiceType.REGULAR
    },
    {
      id: 'tg-reactions-mix',
      platform: Platform.TELEGRAM,
      category: Category.REACTIONS,
      name: 'Реакции (Mix 👍🔥❤️)',
      description: 'Смешанные положительные реакции.',
      pricePer1000: 12.00,
      minQty: 50,
      maxQty: 10000,
      targetType: 'POST',
      geo: 'GLOBAL',
      isActive: true,
      type: ServiceType.REGULAR
    }
  ];

  for (const s of servicesData) {
    const existing = await prisma.internalService.findUnique({ where: { id: s.id } });
    if (!existing) {
      const created = await prisma.internalService.create({ 
        data: {
            ...s,
            pricePer1000: s.pricePer1000,
        } 
      });
      console.log('Created service:', created.name);
      
      await prisma.projectServiceOverride.create({
        data: {
          projectId: project.id,
          internalServiceId: created.id,
          isActive: true
        }
      });
    } else {
      console.log('Service already exists:', s.name);
      await prisma.projectServiceOverride.upsert({
        where: { projectId_internalServiceId: { projectId: project.id, internalServiceId: s.id } },
        update: { isActive: true },
        create: { projectId: project.id, internalServiceId: s.id, isActive: true }
      });
    }
  }

  console.log('--- SEEDING COMPLETE ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

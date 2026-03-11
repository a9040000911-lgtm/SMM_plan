import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- CREATING DEMO PROJECT: ELITE BOOSTER ---');

  const demoProject = await prisma.project.upsert({
    where: { slug: 'elite' },
    update: {
      name: 'Elite Booster',
      domain: 'elite-booster.local',
      brandColor: '#D4AF37', // Gold color for premium look
      maintenanceMode: false
    },
    create: {
      name: 'Elite Booster',
      slug: 'elite',
      domain: 'elite-booster.local',
      brandColor: '#D4AF37',
      config: {},
      pricingRules: { defaultMarkup: 1.5 } // 50% markup for elite brand
    }
  });

  // Также убедимся, что основной проект привязан к smmplan.local
  await prisma.project.updateMany({
    where: { slug: '101' },
    data: { domain: 'smmplan.local' }
  });

  console.log('✅ Success!');
  console.log('Project 1: SMM Plan -> http://smmplan.local:3000');
  console.log('Project 2: Elite Booster -> http://elite-booster.local:3000');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

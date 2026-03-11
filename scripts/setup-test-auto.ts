
import { prisma } from '../src/lib/prisma';

async function main() {
  const tgId = BigInt('268747191');
  const channelLink = 'https://t.me/smmMarket69';

  const user = await prisma.user.findFirst({ where: { tgId } });
  if (!user) {
    console.error('User not found');
    return;
  }

  const service = await prisma.internalService.findFirst({ 
    where: { platform: 'TELEGRAM', category: 'VIEWS', isActive: true } 
  });

  if (!service) {
    console.error('Views service not found');
    return;
  }

  const auto = await prisma.autoMonitoring.create({
    data: {
      projectId: user.projectId!,
      userId: user.id,
      internalServiceId: service.id,
      link: channelLink,
      quantity: 100,
      postsLimit: 10,
      isActive: true,
      lastPostId: null // Оставляем null, чтобы он зафиксировал текущий как "базовый"
    }
  });

  console.log('✅ Тестовая подписка создана для канала smmMarket69!');
  console.log('ID задания:', auto.id);
  console.log('Используемая услуга:', service.name);
}

main().catch(console.error).finally(() => prisma.$disconnect());

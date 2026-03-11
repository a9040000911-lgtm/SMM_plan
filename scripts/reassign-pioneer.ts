
import { prisma } from '../src/lib/prisma';

async function main() {
  const tgId = BigInt('268747191');
  
  console.log(`--- REASSIGNING PIONEER RANK FOR TG ${tgId} ---`);

  // Находим пользователя по TG ID
  const user = await prisma.user.findFirst({
    where: { tgId: tgId }
  });

  if (!user) {
    console.error('❌ User not found');
    return;
  }

  // Сбрасываем старого обладателя ранга 1 в этом проекте
  await prisma.user.updateMany({
    where: { projectId: user.projectId, earlyBirdRank: 1 },
    data: { earlyBirdRank: null }
  });

  // Назначаем ранг текущему пользователю
  await prisma.user.update({
    where: { id: user.id },
    data: { earlyBirdRank: 1 }
  });

  console.log(`✅ Pioneer Rank 1 reassigned to user ${user.id} in project ${user.projectId}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

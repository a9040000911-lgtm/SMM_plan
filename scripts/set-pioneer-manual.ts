
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { tgId: BigInt('268747191') },
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { earlyBirdRank: 1 }
    });
    console.log(`Successfully updated user ${user.id} to Pioneer Rank 1.`);
  } else {
    console.log('User not found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const order = await prisma.order.findUnique({
      where: { id: 30 },
      select: {
        id: true,
        externalId: true,
        status: true,
        metadata: true,
        providerName: true,
        costPrice: true,
        totalPrice: true,
        user: { select: { email: true } }
      }
    });
    console.log(JSON.stringify(order, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

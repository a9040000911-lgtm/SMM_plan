import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const u = await prisma.user.findFirst({ where: { email: 'e2e-client-support@smmplan.pro' } });
    if (!u) { console.log('User not found'); return; }
    console.log('Balance:', u.balance);
    const o = await prisma.order.findFirst({ where: { link: 'https://example.com/stuck_post' } });
    console.log('Order status:', o ? o.status : 'not found');
}
main().finally(() => prisma.$disconnect());

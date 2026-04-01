import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Checking services...");
    const s1 = await prisma.internalService.findFirst({
        where: { numericId: 591 },
        include: { serviceCategory: true }
    });
    console.log("Service 591:", JSON.stringify(s1, null, 2));

    const s2 = await prisma.internalService.findFirst({
        where: { numericId: 308 },
        include: { serviceCategory: true }
    });
    console.log("Service 308:", JSON.stringify(s2, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

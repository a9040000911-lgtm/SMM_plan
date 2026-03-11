import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log("🧹 Starting Database Prune...");

    // 1. Find Test Users
    const testUsers = await prisma.user.findMany({
        where: {
            email: {
                startsWith: "test_"
            }
        }
    });

    console.log(`🔍 Found ${testUsers.length} test users to delete.`);

    for (const user of testUsers) {
        console.log(`   Deleting data for ${user.email} (${user.id})...`);

        // Delete related entities first (FK validation)
        await prisma.transaction.deleteMany({ where: { userId: user.id } });
        await prisma.ledgerEntry.deleteMany({ where: { userId: user.id } });
        await prisma.order.deleteMany({ where: { userId: user.id } });

        // Finally delete user
        await prisma.user.delete({ where: { id: user.id } });
    }

    // 2. Prune Test Services
    const testServices = await prisma.internalService.findMany({
        where: { id: { startsWith: "test-service" } }
    });

    console.log(`🔍 Found ${testServices.length} test services to delete.`);
    for (const service of testServices) {
        // Delete mappings
        await prisma.internalServiceMapping.deleteMany({ where: { internalServiceId: service.id } });
        await prisma.internalService.delete({ where: { id: service.id } });
    }

    console.log("✨ Pruning Complete.");
}

main()
    .catch((e) => {
        console.error("❌ Prune Failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

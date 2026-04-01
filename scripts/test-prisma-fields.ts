import { prisma } from "../src/lib/prisma";

async function test() {
    try {
        console.log("Checking ProjectServiceOverride fields...");
        const services = await prisma.internalService.findMany({
            take: 1,
            select: {
                id: true,
                projectOverrides: {
                    select: {
                        customName: true,
                        customPrice: true,
                        customDescription: true,
                        customRequirements: true,
                        isActive: true
                    }
                }
            }
        });
        console.log("SUCCESS: Query executed correctly!");
        console.log(JSON.stringify(services, null, 2));
    } catch (e: any) {
        console.error("FAILURE: Query failed!");
        console.error(e.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();

const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function setTestKeys() {
    const defaultProject = await prisma.project.findFirst({
        orderBy: { createdAt: 'asc' }
    });

    if (!defaultProject) {
        console.log("No default project found to attach keys to.");
        return;
    }

    const currentSettings = defaultProject.paymentSettings || {};
    currentSettings.testShopId = '1155075';
    currentSettings.testSecretKey = 'test_Bz5eSTzvWGA92wbksyOApJbxi-sfJ67LLgMTZSSOulA';
    currentSettings.mode = 'TEST'; // Force TEST mode to test the connection

    await prisma.project.update({
        where: { id: defaultProject.id },
        data: { paymentSettings: currentSettings }
    });

    console.log(`Test keys injected into Project ID: ${defaultProject.id}`);
}

setTestKeys().catch(console.error).finally(() => prisma.$disconnect());

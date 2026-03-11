const { SmartAnalyzerLogic } = require('./src/services/providers/smart-analyzer.logic');
const { PrismaClient } = require('@prisma/client');

async function test() {
    const prisma = new PrismaClient();
    try {
        console.log("Verifying Dynamic Link Types...");

        // 1. Fetch LinkTypes from DB
        const linkTypes = await prisma.linkType.findMany();
        console.log(`Found ${linkTypes.length} dynamic link types in DB.`);

        // 2. Test detection
        // Case 1: VK Gift (should match dynamic VK_GIFT)
        const res1 = SmartAnalyzerLogic.detectSync(
            "VK Подарки быстрые",
            "Подарки для вашего профиля",
            "",
            [],
            linkTypes
        );
        console.log("Result 1 (VK Gift):", res1.targetType === 'VK_GIFT' ? "SUCCESS (Detected VK_GIFT)" : `FAILURE (Detected ${res1.targetType})`);

        // Case 2: TG Paid Reaction (should match dynamic TG_REACTION_PAID)
        const res2 = SmartAnalyzerLogic.detectSync(
            "Платные реакции за звезды",
            "Реакции на пост",
            "",
            [],
            linkTypes
        );
        console.log("Result 2 (TG Paid):", res2.targetType === 'TG_REACTION_PAID' ? "SUCCESS (Detected TG_REACTION_PAID)" : `FAILURE (Detected ${res2.targetType})`);

        // Case 3: Standard Post (should NOT match dynamic)
        const res3 = SmartAnalyzerLogic.detectSync(
            "Простой пост",
            "Просто просмотры",
            "",
            [],
            linkTypes
        );
        console.log("Result 3 (Standard):", res3.targetType === 'POST' || res3.targetType === 'TG_POST' ? "SUCCESS (Detected default)" : `FAILURE (Detected ${res3.targetType})`);

    } catch (e) {
        console.error("Verification failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

test();

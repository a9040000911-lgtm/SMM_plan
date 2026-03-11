import { prisma } from '../src/lib/prisma';
import { SmartAnalyzerService } from '../src/services/providers/smart-analyzer.service';
import { Category, Platform } from '@prisma/client';

async function main() {
    console.log('🚀 Starting Deep AI Service Audit...');

    const allServicesCount = await prisma.internalService.count();
    console.log(`📊 Total Internal Services in DB: ${allServicesCount}`);

    const services = await prisma.internalService.findMany({
        include: {
            providerMappings: {
                include: { providerService: true }
            }
        }
    });

    console.log(`🔎 Auditing ${services.length} services...\n`);
    console.log('| ID | Название | Текущая Кат. | AI Кат. | Текущий Тип | AI Тип | Вердикт |');
    console.log('|---|---|---|---|---|---|---|');

    let issuesCount = 0;

    for (const service of services) {
        const providerService = service.providerMappings[0]?.providerService;
        const description = service.description || (providerService?.rawData as any)?.description || '';

        // Deep AI analysis using Gemini
        const analysis = await SmartAnalyzerService.analyzeService(
            service.name,
            description,
            service.category as Category
        );

        const categoryMismatch = service.category !== analysis?.category;
        const targetTypeMismatch = service.targetType !== analysis?.targetType;

        if (categoryMismatch || targetTypeMismatch) {
            issuesCount++;
            const verdict = categoryMismatch && targetTypeMismatch
                ? '🔴 ПОЛНЫЙ МИСМАТЧ'
                : categoryMismatch ? '🟡 КАТЕГОРИЯ' : '🔵 ТИП ССЫЛКИ';

            console.log(`| ${service.id} | ${service.name} | ${service.category} | **${analysis?.category}** | ${service.targetType} | **${analysis?.targetType}** | ${verdict} |`);
        }
    }

    console.log(`\n✅ Audit finished. Total issues found: ${issuesCount}`);

    if (issuesCount === 0) {
        console.log('✨ All services are perfectly classified!');
    } else {
        console.log('💡 Use "apply-ai-fixes.ts" to resolve these discrepancies (script to be created if needed).');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

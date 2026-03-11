import { prisma } from '../src/lib/prisma';
import { SmartAnalyzerService } from '../src/services/providers/smart-analyzer.service';
import { Category } from '@prisma/client';

async function main() {
    console.log('🛠️ Applying Deep AI Service Fixes...');

    const services = await prisma.internalService.findMany({
        include: {
            providerMappings: {
                include: { providerService: true }
            }
        }
    });

    let count = 0;

    for (const service of services) {
        const providerService = service.providerMappings[0]?.providerService;
        const description = service.description || (providerService?.rawData as any)?.description || '';

        const analysis = await SmartAnalyzerService.analyzeService(
            service.name,
            description,
            service.category as Category
        );

        if (!analysis) continue;

        const needsUpdate = service.category !== analysis.category || service.targetType !== analysis.targetType;

        if (needsUpdate) {
            console.log(`Updating ${service.id}:`);
            console.log(`  - Category: ${service.category} -> ${analysis.category}`);
            console.log(`  - TargetType: ${service.targetType} -> ${analysis.targetType}`);

            await prisma.internalService.update({
                where: { id: service.id },
                data: {
                    category: analysis.category as Category,
                    targetType: analysis.targetType,
                    isActive: true // Ensure fixed services are active
                }
            });

            // Also update the provider service category for consistency
            if (providerService) {
                await prisma.providerService.update({
                    where: { id: providerService.id },
                    data: { category: analysis.category as Category }
                });
            }

            count++;
        }
    }

    console.log(`\n✅ Successfully updated ${count} services.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

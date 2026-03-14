
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupStorefront() {
    console.log('--- 🚀 Starting Full Storefront Configuration (Low-Level Mode) ---');

    // 1. Find the main project
    const project = await prisma.project.findFirst();
    if (!project) throw new Error('No project found in database');
    console.log(`Using Project: ${project.name} (Slug: ${project.slug}, ID: ${project.id})`);

    // 2. Fetch Providers
    const providers = await prisma.provider.findMany({ where: { isEnabled: true } });
    console.log(`Working with ${providers.length} enabled providers.`);

    for (const provider of providers) {
        console.log(`\n--- 🔄 Processing Provider: ${provider.name} (${provider.id}) ---`);
        
        // Fetch active provider services
        const providerServices = await prisma.providerService.findMany({
            where: { 
                providerId: provider.id,
                isActive: true
            }
        });
        console.log(`Found ${providerServices.length} active services.`);

        let importedCount = 0;
        for (const rawSvc of providerServices) {
            try {
                const nameLower = rawSvc.name.toLowerCase();
                let platformSlug = 'other';
                if (nameLower.includes('telegram') || nameLower.includes('тг')) platformSlug = 'telegram';
                else if (nameLower.includes('instagram') || nameLower.includes('инстаграм') || nameLower.includes('ig')) platformSlug = 'instagram';
                else if (nameLower.includes('vk') || nameLower.includes('вк')) platformSlug = 'vk';
                else if (nameLower.includes('youtube') || nameLower.includes('ютуб')) platformSlug = 'youtube';
                else if (nameLower.includes('tiktok') || nameLower.includes('тикток')) platformSlug = 'tiktok';

                const platform = await prisma.socialPlatform.findUnique({ where: { slug: platformSlug } });
                if (!platform) continue;

                // Create/Find ServiceCategory (raw sql or simplified)
                const categoryName = rawSvc.category || 'Other Services';
                let category = await prisma.serviceCategory.findFirst({
                    where: { projectId: project.id, platform: platform.slug as any, name: categoryName }
                });

                if (!category) {
                    category = await prisma.serviceCategory.create({
                        data: {
                            projectId: project.id,
                            platform: platform.slug as any,
                            categoryType: 'OTHER',
                            name: categoryName,
                            icon: 'layers',
                            targetType: 'ALL'
                        }
                    });
                }

                // Upsert Internal Service using raw logic to avoid schema mismatch issues in scripts
                const internalId = `svc-${provider.id}-${rawSvc.externalId}`;
                const rawPriceNum = Number(rawSvc.rawPrice);
                const finalPrice = rawPriceNum * 1.5;

                await prisma.$executeRawUnsafe(`
                    INSERT INTO "InternalService" (
                        "id", "name", "description", "pricePer1000", "minQty", "maxQty", 
                        "isActive", "platform", "socialPlatformId", "serviceCategoryId", 
                        "geo", "category", "targetType", "updatedAt"
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW()
                    ) ON CONFLICT (id) DO UPDATE SET
                        "name" = EXCLUDED."name",
                        "description" = EXCLUDED."description",
                        "pricePer1000" = EXCLUDED."pricePer1000",
                        "isActive" = EXCLUDED."isActive",
                        "socialPlatformId" = EXCLUDED."socialPlatformId",
                        "serviceCategoryId" = EXCLUDED."serviceCategoryId",
                        "updatedAt" = NOW()
                `, 
                internalId, rawSvc.name, rawSvc.description || '', finalPrice, 10, 100000, 
                true, platform.slug.toUpperCase(), platform.id, category.id, 
                'Global', 'OTHER', 'ALL');

                // Mapping
                await prisma.$executeRawUnsafe(`
                    INSERT INTO "InternalServiceMapping" (
                        "id", "internalServiceId", "providerId", "providerServiceId", "projectId", "priority", "isActive", "updatedAt"
                    ) VALUES (
                        gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW()
                    ) ON CONFLICT ("internalServiceId", "providerId", "projectId") DO UPDATE SET
                        "providerServiceId" = EXCLUDED."providerServiceId",
                        "isActive" = EXCLUDED."isActive",
                        "updatedAt" = NOW()
                `,
                internalId, provider.id, rawSvc.id, project.id, 1, true);

                importedCount++;
            } catch (err: any) {
                // console.error(`Error: ${rawSvc.name}`, err.message);
            }
        }
        console.log(`✅ Processed ${importedCount} services for ${provider.name}.`);
    }

    const activeCount = await prisma.internalService.count({ where: { isActive: true } });
    console.log(`\n--- 📊 Final Dashboard ---`);
    console.log(`Total Active Internal Services: ${activeCount}`);
    console.log('✅ Storefront configuration finished.');
}

setupStorefront()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

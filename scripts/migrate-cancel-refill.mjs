import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration for cancel/refill flags using raw SQL...');
    
    // Fetch all provider services with their rawData
    const providerServices = await prisma.providerService.findMany({
        select: {
            id: true,
            rawData: true,
            mappings: {
                select: {
                    internalServiceId: true
                }
            }
        }
    });
    
    console.log(`Found ${providerServices.length} Provider Services.`);
    
    let updatedPsCount = 0;
    let updatedIsCount = 0;
    
    for (const ps of providerServices) {
        try {
            const raw = typeof ps.rawData === 'string' ? JSON.parse(ps.rawData) : ps.rawData;
            const hasCancel = !!raw?.cancel;
            const hasRefill = !!raw?.refill;
            
            // Raw SQL update to bypass outdated Prisma Client types
            await prisma.$executeRawUnsafe(
                `UPDATE "ProviderService" SET cancel = ${hasCancel}, refill = ${hasRefill} WHERE id = '${ps.id}'`
            );
            updatedPsCount++;
            
            if (hasCancel || hasRefill) {
                for (const mapping of ps.mappings) {
                    await prisma.$executeRawUnsafe(
                         `UPDATE "InternalService" SET "isCancelEnabled" = ${hasCancel}, "isRefillEnabled" = ${hasRefill} WHERE id = '${mapping.internalServiceId}'`
                    );
                    updatedIsCount++;
                }
            }
        } catch (e) {
            console.error(`Failed to migrate ProviderService ${ps.id}`, e);
        }
    }
    
    console.log(`Migration completed. Processed ${updatedPsCount} ProviderServices and updated ${updatedIsCount} mapped InternalServices.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

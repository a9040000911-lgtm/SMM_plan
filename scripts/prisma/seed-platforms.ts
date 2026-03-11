import { PrismaClient, Platform } from '@prisma/client';
import { PLATFORM_KEYWORDS, PLATFORM_LABELS } from '@/services/providers/smart-analyzer.logic';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Social Platforms from Enum and Logic...');

    // 1. Get all platforms from Enum (or Logic, they should be synced)
    const platforms = Object.keys(PLATFORM_LABELS) as Platform[];

    for (const p of platforms) {
        const name = p.toString();
        const nameRu = PLATFORM_LABELS[name] || name;
        const keywords = PLATFORM_KEYWORDS[name] || [];

        const slug = name.toLowerCase();

        // Create or Update SocialPlatform
        const socialPlatform = await prisma.socialPlatform.upsert({
            where: { slug },
            update: {
                name,
                nameRu,
                keywords
            },
            create: {
                slug,
                name,
                nameRu,
                keywords,
                isActive: true
            }
        });

        console.log(`Synced Platform: ${name} -> ${socialPlatform.id}`);

        // 2. Migrate existing records (Optional, but good for MVP)
        // We can link existing ProviderServices and InternalServices to this platform
        // This might be heavy, so we can do it in batches or skip for now if just testing schema.
        // Let's do a lightweight link for now.

        // Update ProviderService
        await prisma.providerService.updateMany({
            where: { platform: p as any, socialPlatformId: null },
            data: { socialPlatformId: socialPlatform.id }
        });

        // Update InternalService
        await prisma.internalService.updateMany({
            where: { platform: p as any, socialPlatformId: null },
            data: { socialPlatformId: socialPlatform.id }
        });

        // Update ServiceCategory
        await prisma.serviceCategory.updateMany({
            where: { platform: p as any, socialPlatformId: null },
            data: { socialPlatformId: socialPlatform.id }
        });
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });


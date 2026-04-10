/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 */
import { PrismaClient } from '@prisma/client';
import { slugify } from '../src/utils/slugify';

const prisma = new PrismaClient();

async function main() {
    console.log('Searching for broken slugs (containing underscores)...');
    
    const platforms = await prisma.socialPlatform.findMany();
    
    let updated = 0;
    for (const p of platforms) {
        if (p.slug.includes('_') || !p.slug.match(/[a-z0-9]/i)) {
            const rawName = p.nameRu || p.name;
            const newSlug = slugify(rawName);
            console.log(`Fixing platform: ${p.id}`);
            console.log(`Old slug: "${p.slug}" -> New slug: "${newSlug}"`);
            
            await prisma.socialPlatform.update({
                where: { id: p.id },
                data: { slug: newSlug }
            });
            updated++;
        }
    }
    
    console.log(`\nFixed ${updated} platform slugs.`);
    
    // Now fix ServiceCategory slugs as well, because they might be corrupted
    const categories = await prisma.serviceCategory.findMany();
    let catUpdated = 0;
    for (const c of categories) {
        // We noticed some categories had slugs like "views_177..."
        // This is actually fine for categories since they are auto-generated with _timestamp
        // But let's check if any category slug is purely underscores
        if (!c.slug.match(/[a-z0-9]/i)) {
            const newSlug = slugify(c.name) + '_' + Date.now();
            console.log(`Fixing category: ${c.id}`);
            console.log(`Old slug: "${c.slug}" -> New slug: "${newSlug}"`);
            
            await prisma.serviceCategory.update({
                where: { id: c.id },
                data: { slug: newSlug }
            });
            catUpdated++;
        }
    }
    console.log(`Fixed ${catUpdated} category slugs.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

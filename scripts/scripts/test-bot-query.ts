
import { prisma } from '../src/lib/prisma';
import { LinkService } from '../src/services/providers/link.service';
import { Platform, Category } from '@prisma/client';

async function testQuery(link: string) {
    console.log(`\n--- Testing Link: ${link} ---`);
    const analysis = LinkService.analyze(link);
    if (!analysis) {
        console.log('Analysis failed');
        return;
    }

    console.log('Analysis:', JSON.stringify(analysis, null, 2));

    const targetTypes = [analysis.targetType, 'ALL', 'CUSTOM'];
    if (analysis.targetType === 'CHANNEL') {
        targetTypes.push('CHANNEL_POSTS');
    }

    console.log('Searching for targetTypes:', targetTypes);
    console.log('IsPrivate:', analysis.isPrivate === true);

    const services = await prisma.internalService.findMany({
        where: {
            platform: analysis.platform,
            isActive: true,
            targetType: { in: targetTypes },
            isPrivate: analysis.isPrivate === true,
            category: analysis.possibleCategories?.length ? { in: analysis.possibleCategories } : undefined
        },
        distinct: ['category'],
        select: { category: true }
    });

    console.log('Found Categories:', services.map(s => s.category));
}

async function main() {
    await testQuery('https://t.me/smmMarket69');
    await testQuery('https://t.me/durov/1');
}

main().catch(console.error);

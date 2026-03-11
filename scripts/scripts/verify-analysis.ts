
import { prisma } from '../src/lib/prisma';
import { LinkService } from '../src/services/providers/link.service';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🔍 Testing Link Analyzer with added services...\n');

    const testLinks = [
        { name: 'TG Open Channel', url: 'https://t.me/durov' },
        { name: 'TG Post', url: 'https://t.me/durov/1' },
        { name: 'TG Invite Link', url: 'https://t.me/+AbCdEfGh' },
        { name: 'TG Story', url: 'https://t.me/durov/s/1' },
        { name: 'VK Group', url: 'https://vk.com/club1' },
        { name: 'VK Personal Profile', url: 'https://vk.com/id1' },
        { name: 'VK Wall Post', url: 'https://vk.com/wall1_1' },
        { name: 'VK Video', url: 'https://vk.com/video123_456' },
        { name: 'VK Clip', url: 'https://vk.com/clip123_456' },
        { name: 'Twitch Channel', url: 'https://twitch.tv/pasha' },
    ];

    console.log('| Тип ссылки | URL | Распознанный тип | Доступные категории | Подходящие тарифы |');
    console.log('|------------|-----|------------------|----------------------|-------------------|');

    for (const link of testLinks) {
        const analysis = LinkService.analyze(link.url);
        if (!analysis) {
            console.log(`| ${link.name} | ${link.url} | ❌ FAILED | - | - |`);
            continue;
        }

        // Fetch services that match platform and categories
        // and also validate the link specifically for that service (checks targetType)
        const matchedServices = await prisma.internalService.findMany({
            where: {
                platform: analysis.platform,
                category: { in: analysis.possibleCategories },
                isActive: true
            }
        });

        const validServiceNames = matchedServices
            .filter(s => LinkService.validate(link.url, s.platform, s.targetType).isValid)
            .map(s => s.name)
            .join(', ');

        console.log(`| ${link.name} | ${link.url} | ${analysis.targetType} | ${analysis.possibleCategories.join(', ')} | ${validServiceNames || 'Нет подходящих'} |`);
    }

    console.log('\n🏁 Verification finished!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

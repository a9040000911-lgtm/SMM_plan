const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    try {
        console.log("Seeding LinkTypes with validation patterns...");

        const linkTypes = [
            // --- TELEGRAM ---
            {
                slug: 'TG_CHANNEL',
                name: 'Telegram Канал/Группа',
                platform: 'TELEGRAM',
                keywords: ['канал', 'группа', 'channel', 'group', 'chat', 'чат'],
                validationPattern: '^https?:\\/\\/t\\.me\\/(\\+|joinchat\\/|[@a-zA-Z0-9_]+)$',
                errorMessage: 'Введите корректную ссылку на Telegram канал или группу (t.me/username или t.me/+link)',
                example: 'https://t.me/durov'
            },
            {
                slug: 'TG_POST',
                name: 'Telegram Пост',
                platform: 'TELEGRAM',
                keywords: ['пост', 'запись', 'view', 'просмотр', 'реакц', 'reaction'],
                validationPattern: '^https?:\\/\\/t\\.me\\/[a-zA-Z0-9_]+\\/\\d+$',
                errorMessage: 'Введите корректную ссылку на пост в Telegram (t.me/канал/123)',
                example: 'https://t.me/durov/1'
            },
            {
                slug: 'TG_STORY',
                name: 'Telegram Сторис',
                platform: 'TELEGRAM',
                keywords: ['story', 'сторис', 'истори'],
                validationPattern: '^https?:\\/\\/t\\.me\\/[a-zA-Z0-9_]+\\/s\\/\\d+$',
                errorMessage: 'Введите корректную ссылку на Telegram Story',
                example: 'https://t.me/durov/s/1'
            },
            {
                slug: 'TG_BOT',
                name: 'Telegram Бот',
                platform: 'TELEGRAM',
                keywords: ['bot', 'бот', 'запуск', 'start', 'реферал', 'referral'],
                validationPattern: '^https?:\\/\\/t\\.me\\/[a-zA-Z0-9_]+(\\?start=[a-zA-Z0-9_]+)?$',
                errorMessage: 'Введите корректную ссылку на бота (t.me/botname)',
                example: 'https://t.me/SmmplanBot'
            },

            // --- VK ---
            {
                slug: 'CHANNEL',
                name: 'VK Сообщество',
                platform: 'VK',
                keywords: ['паблик', 'группа', 'сообщество', 'public', 'group', 'club'],
                validationPattern: '^https?:\\/\\/vk\\.com\\/(public|club|event|[@a-zA-Z0-9_\\.]+)$',
                errorMessage: 'Введите ссылку на группу или паблик ВКонтакте',
                example: 'https://vk.com/durov'
            },
            {
                slug: 'POST',
                name: 'VK Пост',
                platform: 'VK',
                keywords: ['пост', 'запись', 'wall'],
                validationPattern: '^https?:\\/\\/vk\\.com\\/(wall|[@a-zA-Z0-9_\\.]+)\\?w=wall[-0-9_]+(_\\d+)?$',
                errorMessage: 'Введите ссылку на запись ВКонтакте (wall)',
                example: 'https://vk.com/wall1_1'
            },
            {
                slug: 'VK_VIDEO',
                name: 'VK Видео',
                platform: 'VK',
                keywords: ['видео', 'video'],
                validationPattern: '^https?:\\/\\/vk\\.com\\/video[-0-9_]+(_\\d+)?$',
                errorMessage: 'Введите ссылку на видео ВКонтакте',
                example: 'https://vk.com/video-1_1'
            },
            {
                slug: 'VK_CLIP',
                name: 'VK Клип',
                platform: 'VK',
                keywords: ['клип', 'clip'],
                validationPattern: '^https?:\\/\\/vk\\.com\\/clip[-0-9_]+(_\\d+)?$',
                errorMessage: 'Введите ссылку на клип ВКонтакте',
                example: 'https://vk.com/clip-1_1'
            },
            {
                slug: 'VK_GIFT',
                name: 'VK Подарки',
                platform: 'VK',
                keywords: ['подарк', 'gift'],
                validationPattern: '^https?:\\/\\/vk\\.com\\/id\\d+$',
                errorMessage: 'Для подарков нужна ссылка на профиль vk.com/id123',
                example: 'https://vk.com/id1'
            },

            // --- INSTAGRAM ---
            {
                slug: 'PROFILE',
                name: 'Instagram Профиль',
                platform: 'INSTAGRAM',
                keywords: ['профиль', 'profile', 'подписчики', 'followers'],
                validationPattern: '^https?:\\/\\/(www\\.)?instagram\\.com\\/[a-zA-Z0-9_\\.]+\\/?$',
                errorMessage: 'Введите ссылку на профиль Instagram',
                example: 'https://instagram.com/cristiano'
            },
            {
                slug: 'VIDEO',
                name: 'Instagram Video/Reels',
                platform: 'INSTAGRAM',
                keywords: ['reel', 'video', 'видео'],
                validationPattern: '^https?:\\/\\/(www\\.)?instagram\\.com\\/(reels?|p|tv)\\/[a-zA-Z0-9_\\-]+\\/?$',
                errorMessage: 'Введите ссылку на Reels или Видео Instagram',
                example: 'https://instagram.com/reels/ABCD/'
            }
        ];

        for (const lt of linkTypes) {
            await prisma.linkType.upsert({
                where: { slug: lt.slug },
                update: lt,
                create: lt
            });
            console.log(`- Upserted ${lt.slug} (${lt.platform})`);
        }

        console.log("Seeding complete.");
    } catch (e) {
        console.error("Seeding failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

seed();

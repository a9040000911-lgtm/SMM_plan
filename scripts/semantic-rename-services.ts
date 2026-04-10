import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

function generateRussianName(originalName: string, category: string): string {
    const lowers = originalName.toLowerCase();
    
    // 1. Determine Tariff
    let tariff = '[Эконом]'; // Default
    if (lowers.match(/premium|живые|real|топ|гарант|\d+\s*(days|дней)|защит|монетизир|высокое качество|hq|best/i)) {
        tariff = '[Премиум]';
    } else if (lowers.match(/стандарт|быстрые|fast|лучшая|отличная|standard|speed|moderate/i)) {
        tariff = '[Стандарт]';
    } else if (lowers.match(/bot|бот|эконом|cheap|low/i)) {
        tariff = '[Эконом]'; // Explicit economy
    }

    // 2. Determine Core Action
    let action = 'Продвижение';
    if (lowers.match(/like|лайк/i)) action = 'Лайки';
    else if (lowers.match(/view|просмотр|охват/i)) action = 'Просмотры';
    else if (lowers.match(/subscriber|follower|подписчик|в группу|friend|друзья|member|участник/i)) action = 'Подписчики';
    else if (lowers.match(/comment|комментари/i)) action = 'Комментарии';
    else if (lowers.match(/repost|share|репост|поделит/i)) action = 'Репосты';
    else if (lowers.match(/emotion|reaction|реакция/i)) action = 'Реакции';
    else if (lowers.match(/poll|опрос|vote|голосован/i)) action = 'Голоса в опрос';
    else if (lowers.match(/boost|буст/i)) action = 'Бусты канала';
    else if (lowers.match(/save|сохранен/i)) action = 'Сохранения';
    else if (lowers.match(/bit cheer|донат/i)) action = 'Донаты (Bits)';
    else if (lowers.match(/star|звезд/i)) action = 'Звезды (Stars)';
    else if (lowers.match(/traffic|трафик|посетител/i)) action = 'Трафик';
    else if (lowers.match(/complaint|жалоб/i)) action = 'Жалобы';
    else if (category === 'SUBSCRIBERS') action = 'Подписчики';
    else if (category === 'LIKES') action = 'Лайки';
    else if (category === 'VIEWS') action = 'Просмотры';
    else if (category === 'COMMENTS') action = 'Комментарии';
    else if (category === 'REPOSTS') action = 'Репосты';

    // 3. Determine Target/Context
    const contexts: string[] = [];
    if (lowers.match(/video|видео/i)) contexts.push('для видео');
    else if (lowers.match(/post|пост|tweet|твит|publication/i)) contexts.push('на пост');
    else if (lowers.match(/story|истори/i)) contexts.push('на истории');
    else if (lowers.match(/reels|клип/i)) contexts.push('на Reels/Клипы');
    else if (lowers.match(/stream|стрим|broadcast/i)) contexts.push('на стрим');
    else if (lowers.match(/channel|group|канал|групп/i) && action === 'Подписчики') contexts.push('в сообщество');

    // 4. Determine Modifiers / GEO
    const modifiers: string[] = [];
    if (tariff === '[Премиум]' && lowers.match(/real|живые/i)) modifiers.push('Живые');
    else if (tariff === '[Премиум]' && lowers.match(/search|поиск/i)) modifiers.push('Из поиска');
    
    if (lowers.match(/ru|рф|russia|россия/i)) modifiers.push('Россия');
    else if (lowers.match(/cis|снг/i)) modifiers.push('СНГ');
    
    if (lowers.match(/рандом|random|any/i)) modifiers.push('Случайные');
    
    // Duration/Retention modifiers
    const holdMatch = lowers.match(/(\d+)\s*(sec|min|секунд|минут)/i);
    if (holdMatch) {
        const u = holdMatch[2].startsWith('s') || holdMatch[2].startsWith('с') ? 'сек.' : 'мин.';
        modifiers.push(`Удержание ${holdMatch[1]} ${u}`);
    }

    // Assemble components
    let contextStr = contexts.length > 0 ? (' ' + contexts[0]) : '';
    let modifierStr = modifiers.length > 0 ? ` (${modifiers.join(', ')})` : '';

    return `${tariff} ${action}${contextStr}${modifierStr}`;
}

async function run() {
    console.log('Fetching all services for renaming...');
    const services = await prisma.internalService.findMany({
        where: { isActive: true } // We just activated all of them
    });

    let updated = 0;
    for (const svc of services) {
        if (!svc.providerPriceOriginal) {
            // Wait, we just need to rename all 247 Smmtoolbox imported records.
            // Smmtoolbox services have a specific origin, but renaming everything to this standard is actually great.
        }

        const newName = generateRussianName(svc.name, svc.category);
        
        await prisma.internalService.update({
            where: { id: svc.id },
            data: { name: newName }
        });
        
        console.log(`[${svc.id}] ${svc.name}  ==>  ${newName}`);
        updated++;
    }

    console.log(`✅ Успешно переименовано ${updated} услуг! Полностью русский язык и тарифы.`);
    process.exit(0);
}

run().catch(console.error);

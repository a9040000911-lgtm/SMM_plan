import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

function cleanName(rawName: string): string {
    let name = rawName;
    // Remove provider brands
    name = name.replace(/vexboost|socrocket|smmprime|smm_panelus|stream_promotion|MAX \(max\.ru\)|MAX/gi, '');
    
    // Remove emojis
    name = name.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2B50}\u{23E9}-\u{23F3}]/gu, '');
    name = name.replace(/⚡️/g, '').replace(/⭐/g, '').replace(/🔥/g, '').replace(/🌱/g, '');
    
    // Remove numerical prefixes like "537. IG" -> "IG"
    name = name.replace(/^\d+\.\s*/, '');
    
    // Remove tags in brackets
    name = name.replace(/\[HQ[^\]]*\]/ig, '');
    name = name.replace(/\[Гарантия[^\]]*\]/ig, '');
    name = name.replace(/\[Без списаний\]/ig, '');
    name = name.replace(/\[Живые\]/ig, '');
    name = name.replace(/\[Лучшая цена!\]/ig, '');
    
    // Clean up spaces
    name = name.replace(/\s+/g, ' ').trim();
    name = name.replace(/^-\s*/, '').replace(/\s*-\s*$/, '');
    
    if (name.length === 0) name = 'Продвижение (Стандарт)';
    return name;
}

function processDescription(rawDesc: string) {
    let requirements = '';
    const reqList: string[] = [];
    const descParts: string[] = [];
    
    const lowers = rawDesc.toLowerCase();
    
    // Detect requirements
    if (lowers.includes('указывать ссылку') || lowers.includes('прикреплять ссылку') || lowers.includes('ссылку необходимо')) {
        reqList.push('ℹ️ Ссылка должна соответствовать выбранному типу услуги.');
    }
    if (lowers.includes('открыт') || lowers.includes('публич')) {
        reqList.push('⚠️ Профиль/канал должен быть публичным на всё время выполнения заказа.');
    }
    if (lowers.includes('бот') && lowers.includes('админ')) {
        reqList.push('⚠️ Необходимо добавить бота в канал в качестве администратора.');
    }
    
    requirements = reqList.join('\n');
    
    // Detect quality
    if (lowers.includes('живые')) {
        descParts.push('• **Качество:** Реальные пользователи (Офферы)');
    } else if (lowers.includes('бот') || lowers.includes('медлен')) {
        descParts.push('• **Качество:** Аккаунты базового уровня');
    } else {
        descParts.push('• **Качество:** Смешанная аудитория');
    }
    
    // Detect GEO
    if (lowers.includes('россия') || lowers.includes('рф')) {
        descParts.push('• **Регион:** Россия / СНГ');
    } else if (lowers.includes('снг')) {
        descParts.push('• **Регион:** СНГ');
    } else {
        descParts.push('• **Регион:** Весь мир (Микс)');
    }
    
    // Detect warranty
    if (lowers.includes('без гарант') || lowers.includes('без гарантий')) {
        descParts.push('• **Гарантия:** Отсутствует (Возможны списания)');
    } else if (lowers.includes('гарант') && lowers.includes('30')) {
        descParts.push('• **Гарантия:** 30 дней (Защита от списаний)');
    } else if (lowers.includes('гарант') && lowers.includes('60')) {
        descParts.push('• **Гарантия:** 60 дней (Защита от списаний)');
    } else if (lowers.includes('гарант') && lowers.includes('90')) {
        descParts.push('• **Гарантия:** 90 дней (Защита от списаний)');
    } else if (lowers.includes('без списаний') || lowers.includes('стабильн')) {
        descParts.push('• **Гарантия:** Высокая стабильность (Без обвалов)');
    } else {
        descParts.push('• **Удержание:** Естественное (допускаются отписки)');
    }
    
    const finalDesc = 'Обеспечьте стабильный рост показателей.\n\n' + descParts.join('\n');
    
    return {
        description: finalDesc,
        requirements: requirements
    };
}

async function run() {
    console.log('Fetching imported services...');
    // Fetch all internal services mapped via our recent script
    const services = await prisma.internalService.findMany({
        where: {
            description: {
                contains: 'РФ' // Just as an example, but we will rewrite ALL of them since the user requested 247 services
            }
        }
    });
    
    const allServices = await prisma.internalService.findMany();
    
    let updated = 0;
    
    for (const svc of allServices) {
        if (!svc.name) continue;
        
        const newName = cleanName(svc.name);
        const { description, requirements } = processDescription(svc.description || '');
        
        // Update in DB
        await prisma.internalService.update({
            where: { id: svc.id },
            data: {
                name: newName,
                description: description,
                requirements: requirements
            }
        });
        
        updated++;
    }
    
    console.log(`✅ Успешно переписано ${updated} услуг в строгий B2B стиль!`);
    process.exit(0);
}

run().catch(console.error);

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'turbo_orders_data');

interface Order {
    id: string;
    category: string;
    activity: string;
    service: string;
    link: string;
    status: string;
    providerComment: string;
}

const statusCounts: Record<string, number> = {};
const reasonsCount: Record<string, number> = {};
const glitchedServices: Record<string, { total: number, canceled: number }> = {};
let totalCanceled = 0;
let totalOrdersFiltered = 0;

function detectCancelReason(order: Order): string {
    const link = (order.link || '').toLowerCase().trim();
    const comment = (order.providerComment || '').toLowerCase().trim();
    const activity = (order.activity || '').toLowerCase();
    const category = (order.category || '').toLowerCase();

    // 1. Explicit Provider Errors (if provider panel passed an explicit message)
    if (comment && comment !== '-' && !comment.includes('api order id:') && comment.length > 4) {
        if (comment.includes('not found') || comment.includes('invalid link')) return 'Провайдер: Ссылка не найдена (Not Found)';
        if (comment.includes('cancel') || comment.includes('отмен')) return 'Провайдер: Отменен исходной панелью';
        if (comment.includes('refund')) return 'Провайдер: Автоматический Refund';
        return `Провайдер: Специфическая ошибка ("${comment.substring(0, 30)}...")`;
    }

    // 2. Heuristics for Links/User Errors (when panel returns generic Api ID or empty but cancels it)
    if (category.includes('telegram')) {
        if (activity.includes('просмотр') || activity.includes('реакц')) {
            // Views/Reactions require a POST link (e.g., t.me/channel/123), not a CHANNEL/INVITE link
            if (link.includes('joinchat') || link.includes('+')) return 'Ошибка Юзера: Заказ просмотров/реакций на приватный инвайт (+/joinchat)';
            // Count slashes: https://t.me/durov vs https://t.me/durov/1
            const parts = link.split('/');
            // If the last part is not a number, it's likely a channel link
            const lastPart = parts[parts.length - 1];
            // Remove queries like ?single
            const cleanLastPart = lastPart.split('?')[0];
            if (!/^\d+$/.test(cleanLastPart) && !link.includes('?')) {
                return 'Ошибка Юзера: Указана ссылка на канал (t.me/user), а не на конкретный пост для просмотров/реакций';
            }
        }
        if (activity.includes('подписч') || activity.includes('subscriber')) {
            if (link.includes('/')) {
                const parts = link.split('/');
                const last = parts[parts.length - 1];
                if (/^\d+$/.test(last)) {
                    return 'Ошибка Юзера: Заказ подписчиков на конкретный пост (t.me/user/123), а не на канал';
                }
            }
        }
    }

    if (category.includes('vk') || category.includes('вк')) {
        if (activity.includes('подписч') || activity.includes('вступл')) {
             return 'Скрытая Причина (Провайдер ВК): Возможно, группа закрыта или в ней < 10 подписчиков (жесткие фильтры базы)';
        }
        if (link.includes('wall-') && !activity.includes('лайк') && !activity.includes('репост')) {
            return 'Ошибка Юзера: Ссылка на пост (wall), хотя заказана услуга для паблика/профиля';
        }
    }

    if (category.includes('instagram')) {
         if (activity.includes('лайк') || activity.includes('просмотр')) {
             if (!link.includes('/p/') && !link.includes('/reel/') && !link.includes('/tv/')) {
                 return 'Ошибка Юзера: Нужна ссылка на публикацию (/p/ или /reel/), а указан профиль';
             }
         }
         if (activity.includes('подписч')) {
             if (link.includes('/p/') || link.includes('/reel/')) {
                 return 'Ошибка Юзера: Указана ссылка на пост, а нужны подписчики на профиль';
             }
             return 'Скрытая Причина: Профиль, вероятно, является закрытым (Private Account)';
         }
    }
    
    // 3. Very generic bad links
    if (!link.includes('http') && !link.includes('t.me') && link.length < 5) return 'Ошибка Юзера: Введена пустая или бессмысленная ссылка ("'+link+'")';

    return 'Отказ базы: Неизвестная техническая отмена без объяснения от провайдера';
}

async function run() {
    console.log('>>> Начинаем Анализ Причин Отмен (Root Cause)...');
    
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const startTime = Date.now();

    for (let i = 0; i < files.length; i++) {
        const filePath = path.join(DATA_DIR, files[i]);
        const content = fs.readFileSync(filePath, 'utf-8');
        let orders: Order[] = JSON.parse(content);
        
        for (const order of orders) {
            totalOrdersFiltered++;
            const statusStr = (order.status || 'Неизвестно').trim();
            statusCounts[statusStr] = (statusCounts[statusStr] || 0) + 1;

            const isFail = statusStr === 'Отменен' || statusStr === 'РћС‚РјРµРЅРµРЅ' || statusStr.toLowerCase().includes('canceled');
            
            const srv = `[${order.category}] ${order.activity} - ${order.service}`;
            if (!glitchedServices[srv]) glitchedServices[srv] = { total: 0, canceled: 0 };
            glitchedServices[srv].total++;

            if (isFail) {
                totalCanceled++;
                glitchedServices[srv].canceled++;

                const reason = detectCancelReason(order);
                reasonsCount[reason] = (reasonsCount[reason] || 0) + 1;
            }
        }
        process.stdout.write(`\rОбработка файлов: ${i + 1}/${files.length}... Отмененных найдено: ${totalCanceled}`);
    }

    console.log('\n\n✅ Анализ успешно завершен! Время: ' + ((Date.now() - startTime) / 1000).toFixed(1) + ' сек.\n');

    console.log('====== СТАТУСЫ ======');
    Object.entries(statusCounts).sort((a,b) => b[1] - a[1]).forEach(([k,v]) => {
        console.log(`- ${k}: ${v.toLocaleString('ru-RU')}`);
    });

    console.log('\n=== РЕЙТИНГ ПРИЧИН ОТМЕН (ROOT CAUSE) ===');
    const sortedReasons = Object.entries(reasonsCount).sort((a,b) => b[1] - a[1]).slice(0, 15);
    sortedReasons.forEach(([reason, count], i) => {
        console.log(`${i+1}. [${count.toLocaleString('ru-RU')} раз] ${reason} (${((count/totalCanceled)*100).toFixed(1)}%)`);
    });

    console.log('\n=== ТОП-10 САМЫХ "ГЛЮЧНЫХ" УСЛУГ ===');
    // Filter services with at least 500 total orders to ensure statistical significance
    const sortedGlitch = Object.entries(glitchedServices)
        .filter(([k,v]) => v.total > 500)
        .sort((a,b) => (b[1].canceled/b[1].total) - (a[1].canceled/a[1].total))
        .slice(0, 10);
    
    sortedGlitch.forEach(([srv, stats], i) => {
        const failRate = ((stats.canceled / stats.total) * 100).toFixed(1);
        console.log(`${i+1}. ${srv}: Отмен ${stats.canceled}/${stats.total} (${failRate}%)`);
    });

    const report = {
        statuses: statusCounts,
        reasons: sortedReasons.map(([r,c]) => ({ reason: r, count: c })),
        badServices: sortedGlitch.map(([s, stats]) => ({ service: s, ...stats }))
    };

    fs.writeFileSync(path.join(__dirname, 'turbo_fail_report.json'), JSON.stringify(report, null, 2));
    console.log('\n[!] Экспертный отчет сохранен в scripts/turbo_fail_report.json');
}

run().catch(console.error);

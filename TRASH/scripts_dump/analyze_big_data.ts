import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'turbo_orders_data');

interface Order {
  id: string;
  user: string;
  category: string;
  activity: string;
  service: string;
  link: string;
  amount: string;
  status: string;
  price: string;
  date: string;
  provider: string;
  providerComment: string;
}

// Stats accumulators
let totalOrders = 0;
let totalRevenue = 0;
let successfulCount = 0;
let failedCount = 0;
let partialCount = 0;
let pendingCount = 0;

const providerStats: Record<string, { count: number, revenue: number, fails: number }> = {};
const categoryStats: Record<string, { count: number, revenue: number }> = {};
const topServices: Record<string, { count: number, revenue: number }> = {};
const topUsers: Record<string, { count: number, revenue: number, categories: Set<string> }> = {};
const statusDistribution: Record<string, number> = {};

function cleanProviderName(raw: string): string {
    if (!raw || raw.trim() === '-') return 'Собственная система (без провайдера)';
    // Typical format: "smmprime\n            \n             \n            \n                (1041)"
    const lines = raw.split('\n').filter(l => l.trim() !== '');
    if (lines.length > 0) {
        return lines[0].trim();
    }
    return 'Неизвестно';
}

function extractPrice(priceStr: string): number {
    if (!priceStr || priceStr.trim() === '-' || priceStr.trim() === 'Бесплатно') return 0;
    // Assume string like "4.97 ₽", "120.00 ₽"
    const cleaned = priceStr.replace(/[^\d.,]/g, '').replace(',', '.').trim();
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
}

async function analyzeAllChunks() {
    console.log('>>> Начинаем масштабный анализ базы данных SMM...');
    
    // Get all JSON chunks
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    console.log(`Найдено ${files.length} чанков для анализа.`);
    const startTime = Date.now();

    for (let i = 0; i < files.length; i++) {
        const filePath = path.join(DATA_DIR, files[i]);
        const content = fs.readFileSync(filePath, 'utf-8');
        let orders: Order[] = [];
        try {
            orders = JSON.parse(content);
        } catch (e) {
            console.error(`Ошибка парсинга ${files[i]}: ${e}`);
            continue;
        }

        totalOrders += orders.length;

        for (const order of orders) {
            const price = extractPrice(order.price);
            totalRevenue += price;

            // Normalize status
            const statusStr = (order.status || 'Неизвестно').trim();
            statusDistribution[statusStr] = (statusDistribution[statusStr] || 0) + 1;

            const isFail = statusStr === 'Отменен' || statusStr === 'РћС‚РјРµРЅРµРЅ' || statusStr.toLowerCase().includes('canceled');
            const isPartial = statusStr === 'Частично' || statusStr === 'Р§Р°СЃС‚РёС‡РЅРѕ' || statusStr.toLowerCase().includes('partial');
            const isSuccess = statusStr === 'Завершен' || statusStr === 'Р—Р°РІРµСЂС€РµРЅ' || statusStr.toLowerCase().includes('completed');
            
            if (isSuccess) successfulCount++;
            else if (isFail) failedCount++;
            else if (isPartial) partialCount++;
            else pendingCount++;

            // Clean Provider
            const providerName = cleanProviderName(order.provider);
            if (!providerStats[providerName]) providerStats[providerName] = { count: 0, revenue: 0, fails: 0 };
            providerStats[providerName].count++;
            providerStats[providerName].revenue += price;
            if (isFail) providerStats[providerName].fails++;

            // Category
            const cat = (order.category || 'Unknown').trim();
            if (!categoryStats[cat]) categoryStats[cat] = { count: 0, revenue: 0 };
            categoryStats[cat].count++;
            categoryStats[cat].revenue += price;

            // Service
            const srv = `[${cat}] ${order.activity || ''} - ${order.service || ''}`.trim();
            if (!topServices[srv]) topServices[srv] = { count: 0, revenue: 0 };
            topServices[srv].count++;
            topServices[srv].revenue += price;

            // User cohorts
            const email = (order.user || 'Unknown').trim();
            if (!topUsers[email]) topUsers[email] = { count: 0, revenue: 0, categories: new Set() };
            topUsers[email].count++;
            topUsers[email].revenue += price;
            topUsers[email].categories.add(cat);
        }

        process.stdout.write(`\rОбработан чанк ${i + 1}/${files.length} (${( ((i+1)/files.length)*100 ).toFixed(1)}%) | Накоплено: ${totalOrders} заказов...`);
    }

    console.log('\n\n✅ Анализ успешно завершен! Время: ' + ((Date.now() - startTime) / 1000).toFixed(1) + ' сек.\n');

    // Build the final report
    console.log('====== ФИНАНСОВАЯ СВОДКА ======');
    console.log(`Общее количество заказов: ${totalOrders.toLocaleString('ru-RU')}`);
    console.log(`Оборот (Revenue): ${totalRevenue.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}`);
    console.log(`Средний чек (AOV): ${(totalRevenue / totalOrders || 0).toFixed(2)} ₽\n`);

    console.log('====== СТАТУСЫ ЗАКАЗОВ =======');
    console.log(`Успешно завершены: ${successfulCount.toLocaleString('ru-RU')} (${(successfulCount/totalOrders*100).toFixed(1)}%)`);
    console.log(`Отменены (Fail Rate): ${failedCount.toLocaleString('ru-RU')} (${(failedCount/totalOrders*100).toFixed(1)}%)`);
    console.log(`Частичные (Partial Refund): ${partialCount.toLocaleString('ru-RU')} (${(partialCount/totalOrders*100).toFixed(1)}%)`);
    console.log(`В работе / Не оплачены: ${pendingCount.toLocaleString('ru-RU')} (${(pendingCount/totalOrders*100).toFixed(1)}%)\n`);

    console.log('=== ТОП-5 ПЛАТФОРМ ПО ВЫРУЧКЕ ===');
    const sortedCats = Object.entries(categoryStats).sort((a,b) => b[1].revenue - a[1].revenue).slice(0, 5);
    sortedCats.forEach(([cat, stats], i) => {
        console.log(`${i+1}. ${cat}: ${stats.revenue.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })} | ${stats.count} зак.`);
    });
    console.log('');

    console.log('=== ТОП-5 САМЫХ ДОХОДНЫХ ПРОВАЙДЕРОВ ===');
    const sortedProv = Object.entries(providerStats).sort((a,b) => b[1].revenue - a[1].revenue).slice(0, 5);
    sortedProv.forEach(([prov, stats], i) => {
        const provFailRate = (stats.fails / stats.count * 100).toFixed(1);
        console.log(`${i+1}. ${prov}: ${stats.count} зак. | ${stats.revenue.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })} | Отказы: ${provFailRate}%`);
    });
    console.log('');

    console.log('=== ТОП-5 САМЫХ ЧАСТО ЗАКАЗЫВАЕМЫХ УСЛУГ ===');
    const sortedSrv = Object.entries(topServices).sort((a,b) => b[1].count - a[1].count).slice(0, 5);
    sortedSrv.forEach(([srv, stats], i) => {
        console.log(`${i+1}. ${srv}: ${stats.count.toLocaleString('ru-RU')} зак. | Выручка: ${stats.revenue.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}`);
    });
    console.log('');

    console.log('=== ТОП-10 VIP КЛИЕНТОВ (ЛУЧШИЙ LTV) ===');
    const sortedUsers = Object.entries(topUsers).sort((a,b) => b[1].revenue - a[1].revenue).slice(0, 10);
    sortedUsers.forEach(([usr, stats], i) => {
        console.log(`${i+1}. ${usr}: LTV ${stats.revenue.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })} | ${stats.count} зак.`);
    });

    // We can save all raw distribution to a file to render diagrams later
    const comprehensiveReport = {
        financials: { totalOrders, totalRevenue, aov: totalRevenue / totalOrders },
        statuses: { successfulCount, failedCount, partialCount, pendingCount, all: statusDistribution },
        categories: sortedCats.reduce((acc, [k,v]) => ({...acc, [k]: v}), {}),
        providers: sortedProv.reduce((acc, [k,v]) => ({...acc, [k]: v}), {}),
        topServices: sortedSrv.reduce((acc, [k,v]) => ({...acc, [k]: v}), {}),
        topUsers: sortedUsers.map(([k,v]) => ({ email: k, ltv: v.revenue, orders: v.count, categories: Array.from(v.categories) }))
    };

    fs.writeFileSync(path.join(__dirname, 'turbo_analysis_report.json'), JSON.stringify(comprehensiveReport, null, 2));
    console.log('\n[!] Полный JSON отчет сохранен в scripts/turbo_analysis_report.json');
}

analyzeAllChunks().catch(console.error);

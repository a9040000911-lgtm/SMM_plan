import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'turbo_orders_data');

interface Order {
    category: string;
    status: string;
    price: string;
    date: string;
}

// Map: "YYYY-MM" -> { revenue: number, profit: number, orders: number }
const timeline: Record<string, { revenue: number, profit: number, orders: number }> = {};
let totalValidRevenue = 0;
let totalEstimatedProfit = 0;
let validOrdersCount = 0;

function parsePrice(p: string): number {
    if (!p || p === '-' || p === 'Бесплатно') return 0;
    const v = parseFloat(p.replace(/[^\d.,]/g, '').replace(',', '.'));
    return isNaN(v) ? 0 : v;
}

function calculateProfit(category: string, price: number): number {
    const cat = (category || '').toLowerCase();
    
    // Formula: Revenue / (1 + MarkupPercent/100) = Cost
    // Profit = Revenue - Cost
    
    let markup = 2000; // 2000% default

    if (cat.includes('twitch')) {
        markup = 15000;
    } else if (price > 5000) {
        // High ticket items usually have lower relative markup (600% min)
        markup = 600;
    }
    
    const cost = price / (1 + markup / 100);
    return price - cost;
}

async function run() {
    console.log('>>> Начинаем Анализ Динамики Роста и Прибыли (Timeline)...');
    
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const startTime = Date.now();

    for (let i = 0; i < files.length; i++) {
        const filePath = path.join(DATA_DIR, files[i]);
        const content = fs.readFileSync(filePath, 'utf-8');
        let orders: Order[] = JSON.parse(content);
        
        for (const order of orders) {
            const statusStr = (order.status || '').trim();
            const dateStr = (order.date || '').trim();
            const price = parsePrice(order.price);
            
            // Ignore refunds, cancels
            const isCanceled = statusStr === 'Отменен' || statusStr === 'РћС‚РјРµРЅРµРЅ' || statusStr.toLowerCase().includes('canceled');
            // Ignore crazy anomalies
            if (isCanceled || price > 50000) continue;
            
            if (dateStr && dateStr.length >= 7) {
                // "2026-03-10 21:12:05" -> "2026-03"
                const month = dateStr.substring(0, 7);
                const profit = calculateProfit(order.category, price);
                
                if (!timeline[month]) timeline[month] = { revenue: 0, profit: 0, orders: 0 };
                
                timeline[month].revenue += price;
                timeline[month].profit += profit;
                timeline[month].orders += 1;
                
                totalValidRevenue += price;
                totalEstimatedProfit += profit;
                validOrdersCount += 1;
            }
        }
        process.stdout.write(`\rОбработка файлов: ${i + 1}/${files.length}...`);
    }

    console.log('\n\n✅ Анализ успешно завершен! Время: ' + ((Date.now() - startTime) / 1000).toFixed(1) + ' сек.\n');

    const sortedMonths = Object.keys(timeline).sort();
    console.log('=== ДИНАМИКА ДОХОДОВ ПО МЕСЯЦАМ ===');
    
    for (const m of sortedMonths) {
        const stats = timeline[m];
        console.log(`[${m}] Выручка: ${stats.revenue.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })} | Прибыль: ${stats.profit.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })} | Заказов: ${stats.orders}`);
    }

    console.log('\n=== ИТОГИ ===');
    console.log(`Всего Успешных/В работе Заказов: ${validOrdersCount.toLocaleString('ru-RU')}`);
    console.log(`РЕАЛЬНАЯ ВЫРУЧКА: ${totalValidRevenue.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}`);
    console.log(`ЧИСТАЯ ПРИБЫЛЬ ЭСТИМАЦИЯ: ${totalEstimatedProfit.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}`);
    const averageMargin = (totalEstimatedProfit / totalValidRevenue) * 100;
    console.log(`Средняя рентабельность проекта: ${averageMargin.toFixed(1)}%`);
    
    fs.writeFileSync(path.join(__dirname, 'turbo_growth_timeline.json'), JSON.stringify(timeline, null, 2));
}

run().catch(console.error);

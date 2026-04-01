import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'turbo_orders_data');
const MARKUPS_FILE = path.join(__dirname, 'turbo_markups_raw.json');

interface Order {
    category: string;
    activity: string;
    service: string;
    status: string;
    price: string;
    date: string;
}

// Map: "YYYY-MM" -> { revenue: number, profit: number, orders: number }
const timeline: Record<string, { revenue: number, profit: number, orders: number }> = {};
let totalValidRevenue = 0;
let totalEstimatedProfit = 0;
let validOrdersCount = 0;
let unmappedOrdersCount = 0;
let unmappedRevenue = 0;

function parsePrice(p: string): number {
    if (!p || p === '-' || p === 'Бесплатно') return 0;
    const v = parseFloat(p.replace(/[^\d.,]/g, '').replace(',', '.'));
    return isNaN(v) ? 0 : v;
}

// 1. Load exact markups
const markupMap = new Map<string, number>();

function getMarkupMapKey(category: string, activity: string, serviceName: string) {
    return `${category?.trim()} - ${activity?.trim()}|${serviceName?.trim()}`.toLowerCase();
}

function loadMarkups() {
    if (!fs.existsSync(MARKUPS_FILE)) return;
    const rawData = JSON.parse(fs.readFileSync(MARKUPS_FILE, 'utf8'));
    for (const line of rawData) {
        // Format: ID | Эконом | Вконтакте | Вконтакте - Подписчики | ... | minMargin | avgMargin % | ...
        const parts = line.split('|').map((p: string) => p.trim());
        if (parts.length < 10) continue;
        
        const name = parts[1];
        const catGroup = parts[2]; // e.g. "Вконтакте"
        const category = parts[3]; // e.g. "Вконтакте - Подписчики"
        
        const avgMarginStr = parts[9].replace('%', '').trim();
        const avgMargin = parseFloat(avgMarginStr);
        
        if (!isNaN(avgMargin)) {
            // Reconstruct the key just like in orders
            const key = `${category}|${name}`.toLowerCase();
            markupMap.set(key, avgMargin);
        }
    }
    console.log(`✅ Loaded ${markupMap.size} strict markups from DB.`);
}

function calculatePreciseProfit(category: string, activity: string, serviceName: string, price: number): number {
    const key = getMarkupMapKey(category, activity, serviceName);
    
    // First exact match (Platform - Activity | Service)
    let markup = markupMap.get(key);
    
    // Fallback loosely just by service name (since sometimes Activity is slightly different)
    if (markup === undefined) {
        for (const [mKey, mVal] of markupMap.entries()) {
            if (mKey.endsWith(`|${serviceName?.toLowerCase()?.trim()}`)) {
                markup = mVal;
                break;
            }
        }
    }
    
    // Fallback: Default heuristic if still unmapped
    if (markup === undefined) {
        unmappedOrdersCount++;
        unmappedRevenue += price;
        const cat = (category || '').toLowerCase();
        markup = 2000; // 2000% default heuristic
        if (cat.includes('twitch')) markup = 15000;
        else if (price > 5000) markup = 600;
    }
    
    // Formula: Revenue = Cost + (Cost * Markup/100) -> Cost = Revenue / (1 + Markup/100)
    const cost = price / (1 + markup / 100);
    return price - cost;
}

async function run() {
    console.log('>>> Начинаем Анализ Динамики Роста и Прибыли (Timeline)...');
    loadMarkups();
    
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
            const isCanceled = statusStr === 'Отменен' || statusStr === 'Отменен' || statusStr.toLowerCase().includes('canceled');
            // Ignore crazy anomalies
            if (isCanceled || price > 50000) continue;
            
            if (dateStr && dateStr.length >= 7) {
                // "2026-03-10 21:12:05" -> "2026-03"
                const month = dateStr.substring(0, 7);
                const profit = calculatePreciseProfit(order.category, order.activity, order.service, price);
                
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

    console.log('\n=== ИТОГИ (ТОЧНАЯ АНАЛИТИКА НАЦЕНОК) ===');
    console.log(`Всего Успешных/В работе Заказов: ${validOrdersCount.toLocaleString('ru-RU')}`);
    console.log(`РЕАЛЬНАЯ ВЫРУЧКА: ${totalValidRevenue.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}`);
    console.log(`ЧИСТАЯ ПРИБЫЛЬ ЭСТИМАЦИЯ (Точная): ${totalEstimatedProfit.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}`);
    const averageMargin = (totalEstimatedProfit / totalValidRevenue) * 100;
    console.log(`Средняя рентабельность платформы: ${averageMargin.toFixed(1)}%`);
    console.log(`Не картировано заказов: ${unmappedOrdersCount.toLocaleString('ru-RU')} (Выручка: ${unmappedRevenue.toLocaleString('ru-RU')} RUB)`);
    
    fs.writeFileSync(path.join(__dirname, 'turbo_growth_timeline_exact.json'), JSON.stringify(timeline, null, 2));
}

run().catch(console.error);

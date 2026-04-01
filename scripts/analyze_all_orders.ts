// @ts-nocheck
import * as fs from 'fs';
import * as path from 'path';

function parseCSV(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const records: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = lines[i].split(';').map(c => c.replace(/^"|"$/g, '').trim());
        if (row.length < 10) continue;
        
        let pricePer1000 = parseFloat(row[9].replace(/[^\d.]/g, ''));
        let markupStr = row[8].replace(/[^\d.-]/g, '');
        let markupPercent = parseFloat(markupStr) || 0;
        
        records.push({
            id: row[0],
            serviceLevel: row[1],
            category: row[2],
            activityName: row[3],
            markup: markupPercent,
            sellPricePer1000: pricePer1000,
        });
    }
    return records;
}

function run() {
    // 1. Загрузка CSV наценок
    const services = parseCSV('smmtoolbox_reference_FULL.csv');
    console.log(`Загружено ${services.length} услуг из CSV.`);

    // 2. Загрузка ВСЕХ JSON файлов
    const dir = 'scripts/turbo_orders_data';
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
    console.log(`Найдено ${files.length} файлов заказов.\n`);

    const allOrders: any[] = [];
    const seenIds = new Set<string>();

    for (const file of files) {
        const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
        for (const order of data) {
            if (!seenIds.has(order.id)) {
                seenIds.add(order.id);
                allOrders.push(order);
            }
        }
    }

    console.log(`Всего уникальных заказов: ${allOrders.length}`);

    // 3. Определяем диапазон дат
    const dates = allOrders.map(o => o.date).filter(Boolean).sort();
    console.log(`Первый заказ: ${dates[0]}`);
    console.log(`Последний заказ: ${dates[dates.length - 1]}`);

    // 4. Группировка по дням и месяцам
    const dailyData: Record<string, { revenue: number; cost: number; profit: number; count: number }> = {};
    const monthlyData: Record<string, { revenue: number; cost: number; profit: number; count: number }> = {};
    const statusCounts: Record<string, number> = {};
    let totalRevenue = 0;
    let totalCost = 0;
    let matchedCount = 0;
    let unmatchedCount = 0;

    for (const order of allOrders) {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
        
        if (order.status === 'Отменен' || order.status === 'Не оплачен') continue;

        const orderPrice = parseFloat(order.price.replace(/[^\d.]/g, '')) || 0;
        
        const matchedService = services.find(s =>
            s.category === order.category &&
            s.serviceLevel === order.service &&
            s.activityName.includes(order.activity)
        );

        let cost: number;
        if (matchedService && matchedService.markup > 0) {
            matchedCount++;
            cost = orderPrice / (1 + (matchedService.markup / 100));
        } else {
            unmatchedCount++;
            // Для несопоставленных используем консервативную наценку 500%
            cost = orderPrice / 6;
        }

        const profit = orderPrice - cost;
        totalRevenue += orderPrice;
        totalCost += cost;

        const day = order.date.substring(0, 10);
        const month = order.date.substring(0, 7);

        if (!dailyData[day]) dailyData[day] = { revenue: 0, cost: 0, profit: 0, count: 0 };
        dailyData[day].revenue += orderPrice;
        dailyData[day].cost += cost;
        dailyData[day].profit += profit;
        dailyData[day].count++;

        if (!monthlyData[month]) monthlyData[month] = { revenue: 0, cost: 0, profit: 0, count: 0 };
        monthlyData[month].revenue += orderPrice;
        monthlyData[month].cost += cost;
        monthlyData[month].profit += profit;
        monthlyData[month].count++;
    }

    console.log(`\n--- СТАТУСЫ ЗАКАЗОВ ---`);
    for (const [status, count] of Object.entries(statusCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${status}: ${count}`);
    }

    console.log(`\n--- СОПОСТАВЛЕНИЕ ---`);
    console.log(`  Точно сопоставлено с наценкой: ${matchedCount}`);
    console.log(`  Без точного сопоставления (оценка 500%): ${unmatchedCount}`);

    console.log(`\n--- ИТОГО ПО ВСЕМ ФАЙЛАМ ---`);
    console.log(`  Выручка (Revenue): ${totalRevenue.toFixed(2)} ₽`);
    console.log(`  Себестоимость (Cost): ${totalCost.toFixed(2)} ₽`);
    console.log(`  Прибыль (Profit): ${(totalRevenue - totalCost).toFixed(2)} ₽`);
    console.log(`  Средняя рентабельность: ${(((totalRevenue - totalCost) / totalCost) * 100).toFixed(2)}%`);

    console.log(`\n--- ПО МЕСЯЦАМ ---`);
    for (const [month, d] of Object.entries(monthlyData).sort()) {
        console.log(`  ${month}: Выручка ${d.revenue.toFixed(0)} ₽ | Себест. ${d.cost.toFixed(0)} ₽ | Прибыль ${d.profit.toFixed(0)} ₽ | Заказов: ${d.count}`);
    }

    console.log(`\n--- ПО ДНЯМ ---`);
    for (const [day, d] of Object.entries(dailyData).sort()) {
        console.log(`  ${day}: Выручка ${d.revenue.toFixed(0)} ₽ | Прибыль ${d.profit.toFixed(0)} ₽ | Заказов: ${d.count}`);
    }

    // Сохраняем
    fs.writeFileSync('growth_timeline_full.json', JSON.stringify({ daily: dailyData, monthly: monthlyData, statusCounts, totalRevenue, totalCost, totalOrders: allOrders.length }, null, 2));
    console.log('\nСохранено в growth_timeline_full.json');
}

run();

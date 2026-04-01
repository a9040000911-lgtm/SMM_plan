// @ts-nocheck
import * as fs from 'fs';

function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const records = [];
    
    // Skip header
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const row = lines[i].split(';').map(c => c.replace(/^"|"$/g, '').trim());
        if (row.length < 10) continue;
        
        let pricePer1000 = parseFloat(row[9].replace(/[^\d.]/g, ''));
        let markupStr = row[8].replace(/[^\d.-]/g, '');
        let markupPercent = parseFloat(markupStr) || 0;
        
        let providerCostPer1000 = pricePer1000 / (1 + (markupPercent / 100));
        
        records.push({
            id: row[0],
            serviceLevel: row[1], // Эконом
            category: row[2], // Вконтакте
            activityName: row[3], // Вконтакте - Просмотры на пост
            markup: markupPercent,
            sellPricePer1000: pricePer1000,
            costPer1000: providerCostPer1000
        });
    }
    return records;
}

function runAnalysis() {
    console.log('Загрузка SMMToolbox CSV...');
    const services = parseCSV('smmtoolbox_reference_FULL.csv');
    console.log(`Загружено ${services.length} услуг из CSV.`);
    
    console.log('Загрузка заказов из JSON...');
    const rawData = fs.readFileSync('scripts/turbo_orders_data/orders_1774719294987.json', 'utf8');
    const orders = JSON.parse(rawData);
    console.log(`Загружено ${orders.length} заказов.`);
    
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    
    let matchedCount = 0;
    const monthlyData: Record<string, any> = {};

    for (const order of orders) {
        if (order.status === 'Отменен') continue;
        
        const matchedService = services.find(s => 
            s.category === order.category && 
            s.serviceLevel === order.service && 
            s.activityName.includes(order.activity)
        );
        
        const orderPrice = parseFloat(order.price.replace(/[^\d.]/g, '')) || 0;
        
        if (matchedService) {
            matchedCount++;
            const cost = orderPrice / (1 + (matchedService.markup / 100));
            const profit = orderPrice - cost;
            
            totalRevenue += orderPrice;
            totalCost += cost;
            totalProfit += profit;

            const month = order.date.substring(0, 7); // "YYYY-MM"
            if (!monthlyData[month]) {
                monthlyData[month] = { revenue: 0, cost: 0, profit: 0, ordersCount: 0 };
            }
            monthlyData[month].revenue += orderPrice;
            monthlyData[month].cost += cost;
            monthlyData[month].profit += profit;
            monthlyData[month].ordersCount++;
        }
    }
    
    console.log('\n--- РЕЗУЛЬТАТЫ АНАЛИЗА ---');
    console.log(`Распознано заказов с точной наценкой: ${matchedCount} из ${orders.filter(o => o.status !== 'Отменен').length}`);
    console.log(`Общая выручка (Revenue): ${totalRevenue.toFixed(2)} ₽`);
    console.log(`Общая себестоимость (Cost): ${totalCost.toFixed(2)} ₽`);
    console.log(`Чистая прибыль (Profit): ${totalProfit.toFixed(2)} ₽`);
    console.log(`Средняя рентабельность по всей базе: ${((totalProfit / totalCost) * 100).toFixed(2)}%`);
    
    fs.writeFileSync('growth_timeline.json', JSON.stringify(monthlyData, null, 2));
    console.log('График "Динамика роста прибыли по месяцам" выгружен в growth_timeline.json!');
}

runAnalysis();

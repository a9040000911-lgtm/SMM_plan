import * as fs from 'fs';
import * as path from 'path';

function run() {
    const dataPath = path.join(process.cwd(), 'scripts', 'other_sites_orders_full.json');
    if (!fs.existsSync(dataPath)) {
        console.log('Data not found.');
        return;
    }

    const orders = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // site -> month -> revenue
    const monthlyData: Record<string, Record<string, number>> = {};
    const monthlyOrders: Record<string, Record<string, number>> = {};
    const allMonths = new Set<string>();

    for (const o of orders) {
        if (!o.date || o.date === '-') continue;
        
        const dateMatch = o.date.match(/(\d{4})-(\d{2})/);
        if (!dateMatch) continue;

        const monthKey = `${dateMatch[1]}-${dateMatch[2]}`; // YYYY-MM
        allMonths.add(monthKey);

        const st = o.status.toLowerCase();
        let revenue = 0;
        if (st.includes('выполнен') || st.includes('частично') || st.includes('в процессе') || st.includes('ожидает')) {
            revenue = o.revenue || 0;
        }

        if (!monthlyData[o.site]) monthlyData[o.site] = {};
        if (!monthlyData[o.site][monthKey]) monthlyData[o.site][monthKey] = 0;
        monthlyData[o.site][monthKey] += revenue;

        if (!monthlyOrders[o.site]) monthlyOrders[o.site] = {};
        if (!monthlyOrders[o.site][monthKey]) monthlyOrders[o.site][monthKey] = 0;
        monthlyOrders[o.site][monthKey] += 1;
    }

    const sortedMonths = Array.from(allMonths).sort();
    const sites = ['bestsmm.ru', 'spetsnakrutka.ru', 'prodvigaika.ru'];

    console.log(`\n=== ПОМЕСЯЧНАЯ ФИНАНСОВАЯ АНАЛИТИКА ДОП. ПРОЕКТОВ ===\n`);
    
    // Print table header
    const header = ['Месяц', ...sites.map(s => s.padEnd(20))].join(' | ');
    console.log(header);
    console.log('-'.repeat(header.length));

    for (const m of sortedMonths) {
        let row = [m.padEnd(5)]; // 7 length like '2024-05'
        const cols = sites.map(s => {
            const rev = monthlyData[s]?.[m] || 0;
            const ord = monthlyOrders[s]?.[m] || 0;
            if (rev === 0 && ord === 0) return ''.padEnd(20);
            return `${Math.round(rev).toLocaleString('ru-RU')} ₽ (${ord} зк)`.padEnd(20);
        });
        console.log([row[0], ...cols].join(' | '));
    }
}

run();

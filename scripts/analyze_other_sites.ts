import * as fs from 'fs';
import * as path from 'path';

function run() {
    const dataPath = path.join(process.cwd(), 'scripts', 'other_sites_orders_full.json');
    if (!fs.existsSync(dataPath)) {
        console.log('Данные еще не собраны.');
        return;
    }

    const orders = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    const sitesStats: Record<string, any> = {};

    for (const o of orders) {
        if (!sitesStats[o.site]) {
            sitesStats[o.site] = {
                totalOrders: 0,
                revenueCents: 0,
                cancelled: 0,
                unpaid: 0,
                categories: {},
                reasons: {},
                firstDate: '9999-12-31',
                lastDate: '0000-01-01'
            };
        }

        const s = sitesStats[o.site];
        s.totalOrders++;

        // Status
        const st = o.status.toLowerCase();
        if (st.includes('отменен') || st.includes('cancel')) s.cancelled++;
        if (st.includes('не оплачен') || st.includes('unpaid')) s.unpaid++;
        
        // Revenue
        if (st.includes('выполнен') || st.includes('частично') || st.includes('в процессе') || st.includes('ожидает')) {
            s.revenueCents += Math.round(o.revenue * 100);
        }

        // Categories
        const catGroup = o.category.split('\n')[0].trim();
        s.categories[catGroup] = (s.categories[catGroup] || 0) + 1;

        // Dates
        if (o.date && o.date !== '-') {
            const dt = o.date.split(' ')[0]; // YYYY-MM-DD
            if (dt < s.firstDate) s.firstDate = dt;
            if (dt > s.lastDate) s.lastDate = dt;
        }

        // Reasons
        if (st.includes('отменен') && o.reason && o.reason !== '-') {
            s.reasons[o.reason] = (s.reasons[o.reason] || 0) + 1;
        }
    }

    console.log('=== ОТЧЕТ ПО ДОП. ПРОЕКТАМ ===');
    for (const [site, s] of Object.entries(sitesStats)) {
        console.log(`\nСайт: ${site}`);
        console.log(`- Всего заказов: ${s.totalOrders}`);
        console.log(`- Выручка (оценка): ${(s.revenueCents / 100).toFixed(2)} ₽`);
        console.log(`- Отмен: ${s.cancelled} (${((s.cancelled / s.totalOrders) * 100).toFixed(1)}%)`);
        console.log(`- Неоплат: ${s.unpaid} (${((s.unpaid / s.totalOrders) * 100).toFixed(1)}%)`);
        
        const topCategories = Object.entries(s.categories).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3);
        console.log(`- Топ категории: ${topCategories.map(x => `${x[0]} (${x[1]})`).join(', ')}`);
        
        const topReasons = Object.entries(s.reasons).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3);
        console.log(`- Топ причины отмен: ${topReasons.map(x => `${x[0]} (${x[1]})`).join(', ')}`);
    }

    // Save for the dashboard generator
    fs.writeFileSync(path.join(process.cwd(), 'scripts', 'other_sites_summary.json'), JSON.stringify(sitesStats, null, 2));
}

run();

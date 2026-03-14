import fs from 'fs';
import path from 'path';

async function calculateRevenue() {
    const DATA_DIR = path.join(process.cwd(), 'scripts', 'all_orders_data');
    if (!fs.existsSync(DATA_DIR)) {
        console.error('Data directory not found.');
        return;
    }

    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    
    let totalRevenue = 0;
    let paidOrdersCount = 0;
    const platformRevenue = {} as any;

    const paidStatuses = ['Завершен', 'Выполняется', 'Исполнен частично', 'В обработке', 'Ожидание'];

    for (const file of files) {
        const filePath = path.join(DATA_DIR, file);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const orders = JSON.parse(content);
            
            orders.forEach(o => {
                if (paidStatuses.includes(o.status)) {
                    // Try to parse price. Status could have currency symbols or commas.
                    // Assuming RUB based on previous context, but let's be generic.
                    const priceValue = parseFloat(o.price.replace(/[^\d.]/g, '').replace(',', '.'));
                    if (!isNaN(priceValue)) {
                        totalRevenue += priceValue;
                        paidOrdersCount++;
                        
                        const p = o.category || 'Unknown';
                        platformRevenue[p] = (platformRevenue[p] || 0) + priceValue;
                    }
                }
            });
        } catch (e) {
            console.error(`Error reading ${file}:`, e.message);
        }
    }

    const sortedPlatformRev = Object.entries(platformRevenue).sort((a: any, b: any) => b[1] - a[1]);

    const result = {
        totalRevenue: totalRevenue.toFixed(2),
        currency: 'RUB (likely)',
        paidOrdersCount,
        averageOrderValue: (totalRevenue / paidOrdersCount).toFixed(2),
        platformRevenue: sortedPlatformRev.map(([name, rev]) => ({
            name,
            revenue: (rev as number).toFixed(2),
            share: ((rev as number / totalRevenue) * 100).toFixed(2) + '%'
        }))
    };

    fs.writeFileSync(path.join(process.cwd(), 'scripts', 'revenue_analysis_result.json'), JSON.stringify(result, null, 2));
    
    console.log(`--- REVENUE REPORT ---`);
    console.log(`Total Revenue: ${result.totalRevenue}`);
    console.log(`Paid Orders: ${result.paidOrdersCount}`);
    console.log(`Average Order Value: ${result.averageOrderValue}`);
    console.log(`\nTop Platforms by Revenue:`);
    result.platformRevenue.slice(0, 5).forEach(p => {
        console.log(`${p.name}: ${p.revenue} (${p.share})`);
    });
}

calculateRevenue();

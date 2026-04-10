import * as fs from 'fs';
import * as path from 'path';

function run() {
    const dataPath = path.join(process.cwd(), 'scripts', 'other_sites_orders_full.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    const bestsmmOrders = data.filter(o => o.site === 'bestsmm.ru');
    console.log('Total bestsmm orders found in file:', bestsmmOrders.length);
    if (bestsmmOrders.length > 0) {
        console.log('First order date (oldest):', bestsmmOrders[0].date);
        console.log('Last order date (newest):', bestsmmOrders[bestsmmOrders.length - 1].date);
        
        let maxId = 0;
        let maxDate = '';
        for (const o of bestsmmOrders) {
            const idMatch = o.id.match(/\d+/);
            if (idMatch) {
                const idNum = parseInt(idMatch[0], 10);
                if (idNum > maxId) {
                    maxId = idNum;
                    maxDate = o.date;
                }
            }
        }
        console.log('Order with highest ID:', maxId, 'Date:', maxDate);
    }
}
run();

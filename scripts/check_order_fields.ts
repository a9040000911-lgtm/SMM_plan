// @ts-nocheck
import * as fs from 'fs';
import * as path from 'path';

const dir = 'scripts/turbo_orders_data';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();

const seenIds = new Set();

// Собираем ВСЕ ключи первого заказа для проверки UTM/промо
let allKeys = new Set<string>();
let sampleOrders: any[] = [];

for (const file of files.slice(0, 3)) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const order of data.slice(0, 5)) {
        for (const key of Object.keys(order)) allKeys.add(key);
    }
    sampleOrders.push(data[0]);
}

console.log('=== ВСЕ КЛЮЧИ В ЗАКАЗАХ ===');
console.log([...allKeys].sort().join(', '));
console.log('\n=== ОБРАЗЕЦ ЗАКАЗА (полный) ===');
console.log(JSON.stringify(sampleOrders[0], null, 2));

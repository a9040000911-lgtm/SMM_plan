// @ts-nocheck
import * as fs from 'fs';
import * as path from 'path';

const dir = 'scripts/turbo_orders_data';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();

const seenIds = new Set();
const cancelReasons: Record<string, number> = {};
const cancelByCategory: Record<string, number> = {};
const cancelByService: Record<string, number> = {};
const cancelByMonth: Record<string, number> = {};
const partialByMonth: Record<string, number> = {};
const unpaidByMonth: Record<string, number> = {};
const totalByMonth: Record<string, number> = {};
let totalCancelled = 0;
let totalPartial = 0;
let totalUnpaid = 0;
let totalAll = 0;

for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const order of data) {
        if (seenIds.has(order.id)) continue;
        seenIds.add(order.id);
        totalAll++;

        const month = order.date?.substring(0, 7) || 'unknown';
        totalByMonth[month] = (totalByMonth[month] || 0) + 1;

        if (order.status === 'Отменен') {
            totalCancelled++;
            const reason = (order.providerComment || '-').trim();
            cancelReasons[reason] = (cancelReasons[reason] || 0) + 1;
            
            const cat = order.category || 'unknown';
            cancelByCategory[cat] = (cancelByCategory[cat] || 0) + 1;
            
            const svc = `${order.category} > ${order.activity} > ${order.service}`;
            cancelByService[svc] = (cancelByService[svc] || 0) + 1;

            cancelByMonth[month] = (cancelByMonth[month] || 0) + 1;
        }
        
        if (order.status === 'Исполнен частично') {
            totalPartial++;
            partialByMonth[month] = (partialByMonth[month] || 0) + 1;
        }
        
        if (order.status === 'Не оплачен') {
            totalUnpaid++;
            unpaidByMonth[month] = (unpaidByMonth[month] || 0) + 1;
        }
    }
}

console.log(`\n=== АНАЛИЗ ОТМЕН ===`);
console.log(`Всего заказов: ${totalAll}`);
console.log(`Отменённых: ${totalCancelled} (${((totalCancelled/totalAll)*100).toFixed(2)}%)`);
console.log(`Частично исполненных: ${totalPartial} (${((totalPartial/totalAll)*100).toFixed(2)}%)`);
console.log(`Не оплаченных: ${totalUnpaid} (${((totalUnpaid/totalAll)*100).toFixed(2)}%)`);

console.log(`\n--- ТОП-30 ПРИЧИН ОТМЕН (providerComment) ---`);
const sortedReasons = Object.entries(cancelReasons).sort((a,b) => b[1] - a[1]).slice(0, 30);
for (const [reason, count] of sortedReasons) {
    console.log(`  [${count}x] ${reason.substring(0, 120)}`);
}

console.log(`\n--- ОТМЕНЫ ПО КАТЕГОРИЯМ ---`);
for (const [cat, count] of Object.entries(cancelByCategory).sort((a,b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
}

console.log(`\n--- ТОП-20 УСЛУГ ПО ОТМЕНАМ ---`);
const sortedServices = Object.entries(cancelByService).sort((a,b) => b[1] - a[1]).slice(0, 20);
for (const [svc, count] of sortedServices) {
    console.log(`  [${count}x] ${svc}`);
}

console.log(`\n--- % ОТМЕН ПО МЕСЯЦАМ ---`);
for (const month of Object.keys(totalByMonth).sort()) {
    const total = totalByMonth[month];
    const cancelled = cancelByMonth[month] || 0;
    const partial = partialByMonth[month] || 0;
    const unpaid = unpaidByMonth[month] || 0;
    const lostPct = (((cancelled + partial + unpaid) / total) * 100).toFixed(1);
    console.log(`  ${month}: Отмен ${cancelled} (${((cancelled/total)*100).toFixed(1)}%) | Частич. ${partial} | Неоплач. ${unpaid} | Потери ${lostPct}% | Всего ${total}`);
}

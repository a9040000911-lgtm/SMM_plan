import * as fs from 'fs';
import * as path from 'path';

const outPath = path.join(process.cwd(), 'scripts', 'other_sites_orders_full.json');
const fixedPath = path.join(process.cwd(), 'scripts', 'other_sites_orders_full_fixed.json');

// Read existing array
let allOrders = JSON.parse(fs.readFileSync(outPath, 'utf8'));

// Read JSONL
const lines = fs.readFileSync(fixedPath, 'utf8').split('\n');
for (const line of lines) {
    if (!line.trim()) continue;
    try {
        allOrders.push(JSON.parse(line));
    } catch(e) {}
}

// Deduplicate
const uniqueMap = new Map();
let duplicates = 0;
for (const o of allOrders) {
    if (uniqueMap.has(o.id)) {
        duplicates++;
    } else {
        uniqueMap.set(o.id, o);
    }
}

const finalArray = Array.from(uniqueMap.values());
fs.writeFileSync(outPath, JSON.stringify(finalArray, null, 2));

console.log(`Merged successfully! Final total unique orders: ${finalArray.length}`);
console.log(`Duplicates removed: ${duplicates}`);

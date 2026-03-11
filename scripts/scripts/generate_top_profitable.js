const fs = require('fs');

// 1. Load Order Counts
const stats = JSON.parse(fs.readFileSync('scan_stats.json', 'utf8'));
const counts = stats.popularServices;

// 2. Load Prices from CSV
const csvData = fs.readFileSync('smmtoolbox_analysis_report_full.csv', 'utf8');
const lines = csvData.split(String.fromCharCode(10)).slice(1);
const priceMap = {};

lines.forEach(line => {
    const cols = line.split(';');
    if (cols.length < 10) return;
    const name = cols[1]?.replace(/"/g, '').trim();
    const price = parseFloat(cols[8]) || 0;
    const cost = parseFloat(cols[9]) || 0;
    const category = cols[2]?.replace(/"/g, '').trim();
    
    if (name) priceMap[name] = { price, cost, category };
});

// 3. Calculate Profitability
const report = [];
for (const [name, count] of Object.entries(counts)) {
    const data = priceMap[name];
    if (data) {
        const totalProfit = count * (data.price - data.cost);
        report.push({
            name,
            category: data.category,
            count,
            price: data.price,
            total_profit: totalProfit,
            roi: data.cost > 0 ? Math.round(((data.price - data.cost) / data.cost) * 100) : 0
        });
    }
}

report.sort((a, b) => b.total_profit - a.total_profit);

// 4. Generate MD
const top50 = report.slice(0, 50);
let md = '# 🏆 ТОП-50 Самых прибыльных услуг SMMToolbox' + String.fromCharCode(10) + String.fromCharCode(10);
md += '| # | Название услуги | Категория | Заказов | Цена | Прибыль (₽) | ROI |' + String.fromCharCode(10);
md += '|---|:---|:---|:---|:---|:---|:---|' + String.fromCharCode(10);

top50.forEach((item, i) => {
    md += `| ${i+1} | ${item.name} | ${item.category} | ${item.count} | ${item.price}₽ | **${Math.round(item.total_profit)}** | ${item.roi}% |` + String.fromCharCode(10);
});

fs.writeFileSync('top_50_profitable_services.md', md);
console.log('Report generated: top_50_profitable_services.md');
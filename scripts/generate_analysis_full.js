const fs = require('fs');

const data = JSON.parse(fs.readFileSync('toolbox_services_with_descriptions.json', 'utf8'));

const BOM = '\uFEFF';
const header = 'ID;Name;Category;Provider_Type;Provider_Service;Provider_Name;Markup_Val;Total_Markup_Percent;Selling_Price_RUB;Estimated_Cost_RUB;Multiplier;Status_General;Description';
let csv = BOM + header + '\n';

data.forEach(item => {
    const cols = item.allCols;
    if (cols.length < 11) return;

    const id = cols[0];
    const name = cols[1];
    const category = cols[2];
    const providerType = cols[3];
    const providerFull = cols[4];
    
    const providerParts = providerFull.split('|');
    const providerName = providerParts.length > 1 ? providerParts[1].trim() : 'Unknown';
    const providerService = providerParts[0].trim();

    const markupVal = cols[7];
    const markupPercentStr = cols[8].replace('%', '').trim();
    const priceStr = cols[9].replace('₽', '').replace(/\s/g, '').replace(',', '.').trim();
    const statusGeneral = cols[10];
    
    const description = (item.description || '').replace(/[\r\n]+/g, ' ').replace(/;/g, ',').trim();

    const price = parseFloat(priceStr) || 0;
    const markupPercent = parseFloat(markupPercentStr) || 0;
    
    const cost = markupPercent > 0 ? (price / (1 + markupPercent / 100)) : price;
    const multiplier = cost > 0 ? (price / cost).toFixed(2) : '0';

    const row = [
        id,
        `"${name}"`,
        `"${category}"`,
        `"${providerType}"`,
        `"${providerService}"`,
        `"${providerName}"`,
        markupVal,
        markupPercent,
        price.toFixed(2),
        cost.toFixed(4),
        multiplier,
        statusGeneral,
        `"${description}"`
    ].join(';');

    csv += row + '\n';
});

fs.writeFileSync('smmtoolbox_analysis_report_full.csv', csv);
console.log('Final comprehensive report generated: smmtoolbox_analysis_report_full.csv');
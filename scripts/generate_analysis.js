const fs = require('fs');

const data = JSON.parse(fs.readFileSync('toolbox_services_site1_full.json', 'utf8'));

// CSV Header with BOM for Excel UTF-8 support
const BOM = '\uFEFF';
let csv = BOM + 'ID;Name;Category;Provider_Type;Provider_Service;Provider_Name;Markup_Val;Total_Markup_Percent;Selling_Price_RUB;Estimated_Cost_RUB;Multiplier;Status_Provider;Status_Service;Status_General\n';

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

    const statusProvider = cols[5];
    const statusService = cols[6];
    const markupVal = cols[7];
    const markupPercentStr = cols[8].replace('%', '').trim();
    const priceStr = cols[9].replace('₽', '').replace(/\s/g, '').replace(',', '.').trim();
    const statusGeneral = cols[10];

    const price = parseFloat(priceStr) || 0;
    const markupPercent = parseFloat(markupPercentStr) || 0;
    
    // Cost = Price / (1 + MarkupPercent/100)
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
        statusProvider,
        statusService,
        statusGeneral
    ].join(';');

    csv += row + '\n';
});

fs.writeFileSync('smmtoolbox_analysis_report.csv', csv);
console.log('Analysis report generated: smmtoolbox_analysis_report.csv');
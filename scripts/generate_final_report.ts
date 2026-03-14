import fs from 'fs';
import path from 'path';

function generateReport() {
    const dataPath = path.join(process.cwd(), 'scripts', 'real_orders_testing_data.json');
    if (!fs.existsSync(dataPath)) {
        console.error('Data file not found.');
        return;
    }

    const orders = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`--- FINAL REPORT: 10,000 ORDERS ANALYSIS ---`);

    const emails = new Set();
    const stats = {
        total: orders.length,
        statuses: {} as Record<string, number>,
        platforms: {} as Record<string, number>,
        reasons: {} as Record<string, number>
    };

    orders.forEach(o => {
        if (o.user && o.user.includes('@')) emails.add(o.user.toLowerCase());
        
        stats.statuses[o.status] = (stats.statuses[o.status] || 0) + 1;
        stats.platforms[o.category] = (stats.platforms[o.category] || 0) + 1;
        
        if (o.status === 'Отменен' && o.reason && o.reason !== '-') {
            stats.reasons[o.reason] = (stats.reasons[o.reason] || 0) + 1;
        }
    });

    console.log(`\n[CRM DATA] Unique customer emails found: ${emails.size}`);
    fs.writeFileSync(path.join(process.cwd(), 'scripts', 'toolbox_customer_emails.json'), JSON.stringify(Array.from(emails), null, 2));

    console.log('\n[STATUS DISTRIBUTION]');
    Object.entries(stats.statuses).sort((a,b) => b[1] - a[1]).forEach(([k, v]) => {
        console.log(`${k}: ${v} (${((v/stats.total)*100).toFixed(2)}%)`);
    });

    console.log('\n[TOP PLATFORMS]');
    Object.entries(stats.platforms).sort((a,b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => {
        console.log(`${k}: ${v}`);
    });

    console.log('\n[TOP CANCELLATION REASONS]');
    Object.entries(stats.reasons).sort((a,b) => b[1] - a[1]).slice(0, 5).forEach(([k, v]) => {
        console.log(`${k}: ${v}`);
    });
}

generateReport();

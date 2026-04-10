const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  const loginPage = await context.newPage();
  console.log('Logging in to SMMToolbox...');
  await loginPage.goto('https://panel.smmtoolbox.ru/admin/login');
  await pageFill(loginPage, 'input[name="email"]', 'a.sokolov@smm');
  await pageFill(loginPage, 'input[name="password"]', 'Ud5pgC-4uK');
  await loginPage.click('button[type="submit"]');
  await loginPage.waitForSelector('#sidebar', { timeout: 15000 });
  await loginPage.close();

  const startPage = 79015;
  const totalPages = 30000;
  const concurrency = 20; 
  const orders = [];
  const emails = new Set();
  
  // Load existing data if exists
  if (fs.existsSync('toolbox_customer_emails.json')) {
    const existingEmails = JSON.parse(fs.readFileSync('toolbox_customer_emails.json', 'utf8'));
    existingEmails.forEach(e => emails.add(e));
  }

  let processedPages = 0;
  const queue = Array.from({ length: totalPages }, (_, i) => startPage - i);

  const worker = async (id) => {
    const page = await context.newPage();
    await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}', route => route.abort());

    while (queue.length > 0) {
      const pageNum = queue.shift();
      if (!pageNum || pageNum < 1) break;

      try {
        await page.goto(`https://panel.smmtoolbox.ru/admin/orders?page=${pageNum}&site_id=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        const pageData = await page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('table tbody tr'));
          const regexEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          
          return rows.map(row => {
            const cols = Array.from(row.querySelectorAll('td')).map(c => c.innerText.trim());
            if (cols.length < 10) return null;

            // Mapping: ID, User/Email, Service, Link, Qty, Price, Status, Date...
            // Based on previous analysis, price is usually around index 5-6 in orders table
            // Let's grab the raw columns for robust processing
            return {
              service: cols[2],
              qty: cols[4],
              price: cols[5],
              status: cols[6],
              date: cols[8],
              rawText: row.innerText
            };
          }).filter(r => r !== null);
        });

        pageData.forEach(order => {
          orders.push(order);
          const emailMatches = order.rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
          if (emailMatches) emailMatches.forEach(e => emails.add(e.toLowerCase()));
        });

        processedPages++;
        if (processedPages % 100 === 0) {
          console.log(`Progress: ${processedPages}/${totalPages} | Orders: ${orders.length} | Emails: ${emails.size}`);
        }
        
        if (processedPages % 2000 === 0) {
          fs.writeFileSync('toolbox_orders_dump_partial.json', JSON.stringify(orders));
          fs.writeFileSync('toolbox_customer_emails.json', JSON.stringify(Array.from(emails)));
        }

      } catch (e) {
        queue.push(pageNum); // Retry
      }
    }
    await page.close();
  };

  async function pageFill(p, sel, val) {
    await p.waitForSelector(sel);
    await p.fill(sel, val);
  }

  const workers = Array.from({ length: concurrency }, (_, i) => worker(i));
  await Promise.all(workers);

  // Final Data Processing & Analysis
  console.log('Scraping complete. Analyzing data...');
  
  const stats = analyzeOrders(orders);
  fs.writeFileSync('smmtoolbox_business_analysis.json', JSON.stringify(stats, null, 2));
  fs.writeFileSync('toolbox_customer_emails.txt', Array.from(emails).join(String.fromCharCode(10)));
  
  console.log('ANALYSIS COMPLETE. Files generated: smmtoolbox_business_analysis.json, toolbox_customer_emails.txt');
  await browser.close();
})();

function analyzeOrders(orders) {
  let totalRevenue = 0;
  const servicePopularity = {};
  const statusCounts = {};
  
  orders.forEach(o => {
    // Parse price (e.g., "150 ₽" -> 150)
    const price = parseFloat(o.price.replace(/[^\d.]/g, '')) || 0;
    totalRevenue += price;

    servicePopularity[o.service] = (servicePopularity[o.service] || 0) + 1;
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  const avgCheck = orders.length > 0 ? totalRevenue / orders.length : 0;

  return {
    period_info: "Last 30,000 pages of history",
    total_orders_analyzed: orders.length,
    total_revenue_rub: totalRevenue.toFixed(2),
    average_check_rub: avgCheck.toFixed(2),
    top_services: Object.entries(servicePopularity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20),
    order_statuses: statusCounts
  };
}

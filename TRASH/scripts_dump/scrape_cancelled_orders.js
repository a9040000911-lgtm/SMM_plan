const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  const loginPage = await context.newPage();
  console.log('Logging in to scan cancelled orders...');
  await loginPage.goto('https://panel.smmtoolbox.ru/admin/login');
  await loginPage.fill('input[name="email"]', 'a.sokolov@smm');
  await loginPage.fill('input[name="password"]', 'Ud5pgC-4uK');
  await loginPage.click('button[type="submit"]');
  await loginPage.waitForSelector('#sidebar', { timeout: 15000 });
  await loginPage.close();

  const startPage = 79020;
  const pagesToScan = 5000; 
  const cancelledOrders = [];
  const concurrency = 15;
  let processed = 0;
  let queue = Array.from({ length: pagesToScan }, (_, i) => startPage - i);

  const worker = async (id) => {
    const page = await context.newPage();
    await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}', route => route.abort());

    while (queue.length > 0) {
      const pageNum = queue.shift();
      if (!pageNum) break;

      try {
        await page.goto(`https://panel.smmtoolbox.ru/admin/orders?page=${pageNum}&site_id=1`, { waitUntil: 'domcontentloaded' });
        
        const pageData = await page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('table tbody tr'));
          return rows.map(row => {
            const cols = Array.from(row.querySelectorAll('td'));
            if (cols.length < 5) return null;
            
            const status = cols[4].innerText.trim();
            // We only care about cancelled orders
            if (!status.includes('Отменен') && !status.includes('Cancelled')) return null;

            const infoText = cols[2].innerText;
            const linkMatch = infoText.match(/Ссылка:\s*(.*)/);
            const categoryMatch = infoText.match(/Категория:\s*(.*)/);
            const serviceMatch = infoText.match(/Сервис:\s*(.*)/);

            return {
              id: cols[0].innerText.trim(),
              user: cols[1].innerText.trim(),
              category: categoryMatch ? categoryMatch[1].trim() : 'Unknown',
              service: serviceMatch ? serviceMatch[1].trim() : 'Unknown',
              link: linkMatch ? linkMatch[1].trim() : 'Unknown',
              price: cols[3].innerText.trim(),
              status: status,
              date: (infoText.match(/Дата создания:\s*(.*)/) || [])[1] || 'Unknown'
            };
          }).filter(r => r !== null);
        });

        cancelledOrders.push(...pageData);
        processed++;

        if (processed % 100 === 0) {
          console.log(`[Worker ${id}] Page ${pageNum} | Cancelled found: ${cancelledOrders.length} | Processed: ${processed}/${pagesToScan}`);
          // Auto-save every 500 pages
          if (processed % 500 === 0) {
            fs.writeFileSync('cancelled_orders_analysis.json', JSON.stringify(cancelledOrders, null, 2));
          }
        }
      } catch (e) {
        queue.push(pageNum);
      }
    }
    await page.close();
  };

  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i)));

  fs.writeFileSync('cancelled_orders_analysis_final.json', JSON.stringify(cancelledOrders, null, 2));
  console.log(`DONE! Found ${cancelledOrders.length} cancelled orders.`);
  await browser.close();
})();

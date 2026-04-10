const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  const loginPage = await context.newPage();
  console.log('Resuming cancelled orders scrape...');
  await loginPage.goto('https://panel.smmtoolbox.ru/admin/login');
  await loginPage.fill('input[name="email"]', 'a.sokolov@smm');
  await loginPage.fill('input[name="password"]', 'Ud5pgC-4uK');
  await loginPage.click('button[type="submit"]');
  await loginPage.waitForSelector('#sidebar', { timeout: 15000 });
  await loginPage.close();

  const totalPages = 5514;
  const emails = new Set();
  let results = [];

  if (fs.existsSync('all_canceled_orders.json')) {
    results = JSON.parse(fs.readFileSync('all_canceled_orders.json', 'utf8'));
    console.log(`Loaded ${results.length} existing cancelled orders.`);
  }

  // Calculate where to resume (15 orders per page)
  const processedPages = Math.floor(results.length / 15);
  const startFrom = totalPages - processedPages;
  console.log(`Resuming from page ${startFrom} down to 1...`);

  let queue = Array.from({ length: startFrom }, (_, i) => startFrom - i);
  let processedInRun = 0;
  const concurrency = 20;

  const worker = async (id) => {
    const page = await context.newPage();
    await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}', route => route.abort());

    while (queue.length > 0) {
      const pageNum = queue.shift();
      if (!pageNum) break;

      try {
        await page.goto(`https://panel.smmtoolbox.ru/admin/orders?page=${pageNum}&site_id=1&status=canceled`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        const data = await page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('table tbody tr'));
          return rows.map(row => {
            const cols = Array.from(row.querySelectorAll('td'));
            if (cols.length < 5) return null;
            const infoText = cols[2].innerText;
            return {
              id: cols[0].innerText.trim(),
              user: cols[1].innerText.trim(),
              category: (infoText.match(/Категория:\s*(.*)/) || [])[1] || 'Unknown',
              service: (infoText.match(/Сервис:\s*(.*)/) || [])[1] || 'Unknown',
              link: (infoText.match(/Ссылка:\s*(.*)/) || [])[1] || 'Unknown',
              price: cols[3].innerText.trim(),
              date: (infoText.match(/Дата создания:\s*(.*)/) || [])[1] || 'Unknown'
            };
          }).filter(r => r !== null);
        });

        results.push(...data);
        processedInRun++;

        if (processedInRun % 50 === 0) {
          console.log(`[Worker ${id}] Page ${pageNum} | Total Canceled: ${results.length} | Progress: ${Math.round((1 - (queue.length/startFrom))*100)}%`);
          if (processedInRun % 200 === 0) {
            fs.writeFileSync('all_canceled_orders.json', JSON.stringify(results, null, 2));
          }
        }
      } catch (e) {
        queue.push(pageNum);
      }
    }
    await page.close();
  };

  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i)));

  fs.writeFileSync('all_canceled_orders_final.json', JSON.stringify(results, null, 2));
  console.log(`--- DONE! ALL CANCELLED ORDERS COLLECTED: ${results.length} ---`);
  await browser.close();
})();
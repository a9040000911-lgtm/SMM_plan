const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  const loginPage = await context.newPage();
  console.log('Logging in...');
  await loginPage.goto('https://panel.smmtoolbox.ru/admin/login');
  await loginPage.fill('input[name="email"]', 'a.sokolov@smm');
  await loginPage.fill('input[name="password"]', 'Ud5pgC-4uK');
  await loginPage.click('button[type="submit"]');
  await loginPage.waitForSelector('#sidebar', { timeout: 15000 });
  await loginPage.close();

  const startPage = 79021;
  const pagesToScan = 1000; // Let's scan 1000 pages of ONLY canceled orders first
  const concurrency = 15;
  const results = [];

  let queue = Array.from({ length: pagesToScan }, (_, i) => startPage - i);
  let processed = 0;

  const worker = async (id) => {
    const page = await context.newPage();
    await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}', route => route.abort());

    while (queue.length > 0) {
      const pageNum = queue.shift();
      if (!pageNum || pageNum < 1) break;

      const url = `https://panel.smmtoolbox.ru/admin/orders?page=${pageNum}&site_id=1&status=canceled`;
      
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        
        const data = await page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('table tbody tr'));
          return rows.map(row => {
            const cols = Array.from(row.querySelectorAll('td'));
            if (cols.length < 5) return null;
            
            const infoText = cols[2].innerText;
            const linkMatch = infoText.match(/Ссылка:\s*(.*)/);
            const serviceMatch = infoText.match(/Сервис:\s*(.*)/);
            const categoryMatch = infoText.match(/Категория:\s*(.*)/);
            const dateMatch = infoText.match(/Дата создания:\s*(.*)/);

            return {
              id: cols[0].innerText.trim(),
              user: cols[1].innerText.trim(),
              category: categoryMatch ? categoryMatch[1].trim() : 'Unknown',
              service: serviceMatch ? serviceMatch[1].trim() : 'Unknown',
              link: linkMatch ? linkMatch[1].trim() : 'Unknown',
              price: cols[3].innerText.trim(),
              date: dateMatch ? dateMatch[1].trim() : 'Unknown'
            };
          }).filter(r => r !== null);
        });

        results.push(...data);
        processed++;

        if (processed % 50 === 0) {
          console.log(`[Worker ${id}] Page ${pageNum} | Canceled Orders Collected: ${results.length}`);
          if (processed % 200 === 0) {
            fs.writeFileSync('canceled_orders_deep_analysis.json', JSON.stringify(results, null, 2));
          }
        }
      } catch (e) {
        queue.push(pageNum); // Retry
      }
    }
    await page.close();
  };

  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i)));

  fs.writeFileSync('canceled_orders_deep_analysis_final.json', JSON.stringify(results, null, 2));
  console.log(`DONE! Collected ${results.length} unique canceled orders with links.`);
  await browser.close();
})();

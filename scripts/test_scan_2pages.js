const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  const loginPage = await context.newPage();
  console.log('Logging in to SMMToolbox...');
  await loginPage.goto('https://panel.smmtoolbox.ru/admin/login');
  await loginPage.fill('input[name="email"]', 'a.sokolov@smm');
  await loginPage.fill('input[name="password"]', 'Ud5pgC-4uK');
  await loginPage.click('button[type="submit"]');
  await loginPage.waitForSelector('#sidebar', { timeout: 15000 });
  await loginPage.close();

  const startPage = 79020;
  const pagesToTest = 2;
  const orders = [];

  for (let i = 0; i < pagesToTest; i++) {
    const pageNum = startPage - i;
    const page = await context.newPage();
    console.log(`Testing page ${pageNum}...`);
    
    try {
      await page.goto(`https://panel.smmtoolbox.ru/admin/orders?page=${pageNum}&site_id=1`, { waitUntil: 'domcontentloaded' });
      
      const pageData = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        return rows.map(row => {
          const cols = Array.from(row.querySelectorAll('td'));
          if (cols.length < 5) return null;
          
          const infoText = cols[2].innerText;
          const categoryMatch = infoText.match(/Категория:\s*(.*)/);
          const serviceMatch = infoText.match(/Сервис:\s*(.*)/);
          const dateMatch = infoText.match(/Дата создания:\s*(.*)/);

          return {
            user: cols[1].innerText.trim(),
            category: categoryMatch ? categoryMatch[1].trim() : 'Unknown',
            service: serviceMatch ? serviceMatch[1].trim() : 'Unknown',
            price: cols[3].innerText.trim(),
            date: dateMatch ? dateMatch[1].trim() : 'Unknown'
          };
        }).filter(r => r !== null);
      });

      orders.push(...pageData);
      await page.close();
    } catch (e) {
      console.error(`Error on page ${pageNum}:`, e.message);
    }
  }

  fs.writeFileSync('test_orders_2pages.json', JSON.stringify(orders, null, 2));
  console.log(`Test complete. Scraped ${orders.length} orders from 2 pages.`);
  console.log('Sample data:', orders[0]);

  await browser.close();
})();

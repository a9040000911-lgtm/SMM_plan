const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Logging in...');
  await page.goto('https://panel.smmtoolbox.ru/admin/login');
  await page.fill('input[name="email"]', 'a.sokolov@smm');
  await page.fill('input[name="password"]', 'Ud5pgC-4uK');
  await page.click('button[type="submit"]');
  await page.waitForSelector('#sidebar', { timeout: 15000 });

  const lastPage = 79015;
  const pagesToScrape = 50; 
  const emails = new Set();

  for (let i = 0; i < pagesToScrape; i++) {
    const currentPage = lastPage - i;
    if (currentPage < 1) break;

    const url = `https://panel.smmtoolbox.ru/admin/orders?page=${currentPage}&site_id=1`;
    console.log(`Scraping orders page ${currentPage}...`);
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      
      const pageEmails = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        let found = [];
        rows.forEach(row => {
          const match = row.innerText.match(regex);
          if (match) found.push(...match);
        });
        return found;
      });

      pageEmails.forEach(email => emails.add(email.toLowerCase()));
      console.log(`  Found ${pageEmails.length} emails. Unique total: ${emails.size}`);

    } catch (e) {
      console.error(`  Error on page ${currentPage}:`, e.message);
    }
  }

  const result = Array.from(emails);
  fs.writeFileSync('toolbox_customer_emails.json', JSON.stringify(result, null, 2));
  fs.writeFileSync('toolbox_customer_emails.txt', result.join('\n'));
  
  console.log(`DONE! Total unique emails collected: ${emails.size}`);
  await browser.close();
})();
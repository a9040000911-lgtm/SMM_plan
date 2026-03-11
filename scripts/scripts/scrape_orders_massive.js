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
  console.log('Login successful.');

  const startPage = 79015;
  const totalPagesToScrape = 10000;
  const concurrency = 15; // Increased concurrency for speed
  const emails = new Set();
  
  if (fs.existsSync('toolbox_customer_emails.json')) {
    try {
      const existing = JSON.parse(fs.readFileSync('toolbox_customer_emails.json', 'utf8'));
      existing.forEach(e => emails.add(e));
      console.log(`Resuming with ${emails.size} existing emails.`);
    } catch(e) {}
  }

  let processedCount = 0;
  const pages = Array.from({ length: totalPagesToScrape }, (_, i) => startPage - i);

  const worker = async (workerId) => {
    const page = await context.newPage();
    await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}', route => route.abort());

    while (pages.length > 0) {
      const pageNum = pages.shift();
      if (!pageNum || pageNum < 1) break;

      const url = `https://panel.smmtoolbox.ru/admin/orders?page=${pageNum}&site_id=1`;
      
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        
        const found = await page.evaluate(() => {
          const text = document.body.innerText;
          const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          return text.match(regex) || [];
        });

        found.forEach(e => emails.add(e.toLowerCase()));
        
        processedCount++;
        if (processedCount % 100 === 0) {
          console.log(`[${processedCount}/${totalPagesToScrape}] Unique: ${emails.size} | Last page: ${pageNum}`);
          if (processedCount % 500 === 0) {
             fs.writeFileSync('toolbox_customer_emails.json', JSON.stringify(Array.from(emails), null, 2));
          }
        }
      } catch (e) {
        // Retry logic
        pages.push(pageNum);
      }
    }
    await page.close();
  };

  const workers = Array.from({ length: concurrency }, (_, i) => worker(i));
  await Promise.all(workers);

  const finalResult = Array.from(emails);
  fs.writeFileSync('toolbox_customer_emails.json', JSON.stringify(finalResult, null, 2));
  fs.writeFileSync('toolbox_customer_emails.txt', finalResult.join(String.fromCharCode(10)));
  
  console.log(`FINISHED! Total unique emails: ${emails.size}`);
  await browser.close();
})();
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Logging in to SMMToolbox...');
  await page.goto('https://panel.smmtoolbox.ru/admin/login');
  await page.fill('input[name="email"]', 'a.sokolov@smm');
  await page.fill('input[name="password"]', 'Ud5pgC-4uK');
  await page.click('button[type="submit"]');
  await page.waitForSelector('#sidebar', { timeout: 15000 });

  const services = [];
  let currentPage = 1;
  let hasNext = true;

  while (hasNext && currentPage <= 10) { // Limit to 10 pages for safety
    const url = `https://panel.smmtoolbox.ru/admin/services?site_id=16&active=true&api_status=true&page=${currentPage}`;
    console.log(`Scraping page ${currentPage}: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });

    const pageData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const results = rows.map(row => {
        const cols = Array.from(row.querySelectorAll('td'));
        if (cols.length < 5) return null;
        
        // Find price - look for specific text or class
        // Let's grab all columns to be sure
        return cols.map(c => c.innerText.trim());
      }).filter(r => r !== null);

      const nextButton = document.querySelector('a[rel="next"], .pagination .next a');
      return { results, hasNext: !!nextButton };
    });

    services.push(...pageData.results);
    hasNext = pageData.hasNext;
    currentPage++;
    
    if (pageData.results.length === 0) break;
  }

  fs.writeFileSync('toolbox_services_full.json', JSON.stringify(services, null, 2));
  console.log(`Total scraped: ${services.length} services across ${currentPage - 1} pages.`);

  await browser.close();
})();

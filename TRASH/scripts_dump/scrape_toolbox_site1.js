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

  const allServices = [];
  let currentPage = 1;
  const maxPages = 50; // Safety limit

  while (currentPage <= maxPages) {
    const url = `https://panel.smmtoolbox.ru/admin/services?page=${currentPage}&site_id=1&active=true&api_status=true`;
    console.log(`Scraping page ${currentPage}...`);
    
    await page.goto(url, { waitUntil: 'networkidle' });
    
    const pageData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      if (rows.length === 0) return { results: [], hasNext: false };

      const results = rows.map(row => {
        const cols = Array.from(row.querySelectorAll('td'));
        // Based on typical OneUI/Laravel tables, let's grab structured data
        return {
          id: cols[0]?.innerText.trim(),
          name: cols[1]?.innerText.trim(),
          category: cols[2]?.innerText.trim(),
          providerInfo: cols[3]?.innerText.trim(),
          // Often price is in a specific column, let's grab all to analyze later if needed
          allCols: cols.map(c => c.innerText.trim())
        };
      });

      // Check for "Next" in pagination
      const nextBtn = document.querySelector('li.page-item.active + li.page-item:not(.disabled) a');
      return { results, hasNext: !!nextBtn };
    });

    if (pageData.results.length === 0) {
        console.log('No more results found.');
        break;
    }

    allServices.push(...pageData.results);
    console.log(`  Added ${pageData.results.length} services (Total: ${allServices.length})`);

    if (!pageData.hasNext) {
        console.log('Reach last page.');
        break;
    }
    currentPage++;
  }

  fs.writeFileSync('toolbox_services_site1_full.json', JSON.stringify(allServices, null, 2));
  console.log(`DONE! Total scraped: ${allServices.length} services across ${currentPage} pages.`);

  await browser.close();
})();

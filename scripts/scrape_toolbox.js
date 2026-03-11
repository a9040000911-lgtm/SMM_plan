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
  
  // Wait for network to be idle after click or just wait for a specific element on dashboard
  await page.click('button[type="submit"]');
  
  try {
    // Wait for something that indicates we are logged in (e.g. side menu or logout button)
    await page.waitForSelector('#sidebar', { timeout: 10000 });
    console.log('Login successful (sidebar found).');
  } catch (e) {
    console.log('Login might have failed or sidebar not found, checking URL...');
    console.log('Current URL:', page.url());
    if (page.url().includes('login')) {
        console.log('Still on login page. Credentials might be wrong.');
        await browser.close();
        return;
    }
  }

  const targetUrl = 'https://panel.smmtoolbox.ru/admin/services?site_id=16&active=true&api_status=true';
  console.log('Navigating to:', targetUrl);
  await page.goto(targetUrl, { waitUntil: 'networkidle' });

  const selector = '#main-container > div > div:nth-child(3) > div.block-content';
  await page.waitForSelector(selector, { timeout: 15000 });

  console.log('Parsing services...');
  const services = await page.evaluate((sel) => {
    const block = document.querySelector(sel);
    if (!block) return [];

    const rows = Array.from(block.querySelectorAll('table tbody tr'));
    return rows.map(row => {
      const cols = Array.from(row.querySelectorAll('td'));
      if (cols.length < 5) return null;

      return {
        id: cols[0]?.innerText.trim(),
        name: cols[1]?.innerText.trim(),
        category: cols[2]?.innerText.trim(),
        provider: cols[3]?.innerText.trim(),
        price: cols[4]?.innerText.trim(),
        status: cols[cols.length - 1]?.innerText.trim()
      };
    }).filter(s => s !== null);
  }, selector);

  fs.writeFileSync('toolbox_services.json', JSON.stringify(services, null, 2));
  console.log(`Successfully scraped ${services.length} services.`);

  await browser.close();
})();

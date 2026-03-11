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
  const emails = new Set();
  let stats = {
    totalRevenue: 0,
    totalOrders: 0,
    byMonth: {},
    popularServices: {},
    popularCategories: {}
  };

  // Load existing data
  if (fs.existsSync('toolbox_customer_emails.json')) {
    try {
      const existing = JSON.parse(fs.readFileSync('toolbox_customer_emails.json', 'utf8'));
      existing.forEach(e => emails.add(e));
    } catch(e) {}
  }

  let queue = Array.from({ length: 30000 }, (_, i) => startPage - i);
  let processed = 0;
  const concurrency = 20;

  const worker = async (id) => {
    const page = await context.newPage();
    await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}', route => route.abort());

    while (queue.length > 0) {
      const pageNum = queue.shift();
      try {
        await page.goto(`https://panel.smmtoolbox.ru/admin/orders?page=${pageNum}&site_id=1`, { waitUntil: 'domcontentloaded' });
        
        const data = await page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('table tbody tr'));
          return rows.map(row => {
            const cols = Array.from(row.querySelectorAll('td'));
            if (cols.length < 5) return null;
            
            const infoText = cols[2].innerText;
            const categoryMatch = infoText.match(/Категория:\s*(.*)/);
            const serviceMatch = infoText.match(/Сервис:\s*(.*)/);
            const dateMatch = infoText.match(/Дата создания:\s*(\d{4}-\d{2})/);

            return {
              email: cols[1].innerText.trim(),
              category: categoryMatch ? categoryMatch[1].trim() : 'Unknown',
              service: serviceMatch ? serviceMatch[1].trim() : 'Unknown',
              price: cols[3].innerText.trim(),
              month: dateMatch ? dateMatch[1].trim() : 'Unknown',
              text: row.innerText
            };
          }).filter(r => r !== null);
        });

        data.forEach(o => {
          const p = parseFloat(o.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
          const m = o.month;

          stats.totalRevenue += p;
          stats.totalOrders += 1;
          
          if (m !== 'Unknown') {
            if (!stats.byMonth[m]) stats.byMonth[m] = { revenue: 0, count: 0 };
            stats.byMonth[m].revenue += p;
            stats.byMonth[m].count += 1;
          }

          stats.popularServices[o.service] = (stats.popularServices[o.service] || 0) + 1;
          stats.popularCategories[o.category] = (stats.popularCategories[o.category] || 0) + 1;

          if (o.email.includes('@')) emails.add(o.email.toLowerCase());
          const eMatches = o.text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
          if (eMatches) eMatches.forEach(e => emails.add(e.toLowerCase()));
        });

        processed++;
        if (processed % 100 === 0) {
          console.log(`Page ${pageNum} | Rev: ${Math.round(stats.totalRevenue)} RUB | Orders: ${stats.totalOrders} | Emails: ${emails.size}`);
          fs.writeFileSync('scan_stats.json', JSON.stringify(stats, null, 2));
          fs.writeFileSync('toolbox_customer_emails.json', JSON.stringify(Array.from(emails)));
        }
      } catch (e) { queue.push(pageNum); }
    }
    await page.close();
  };

  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i)));
  await browser.close();
})();

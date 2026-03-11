const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  const loginPage = await context.newPage();
  console.log('Resuming competitive analysis scan...');
  await loginPage.goto('https://panel.smmtoolbox.ru/admin/login');
  await loginPage.fill('input[name="email"]', 'a.sokolov@smm');
  await loginPage.fill('input[name="password"]', 'Ud5pgC-4uK');
  await loginPage.click('button[type="submit"]');
  await loginPage.waitForSelector('#sidebar', { timeout: 15000 });
  await loginPage.close();

  // Load Existing Progress
  let stats = { totalRevenue: 0, totalOrders: 0, byMonth: {}, popularServices: {}, popularCategories: {} };
  const emails = new Set();

  if (fs.existsSync('scan_stats.json')) {
    stats = JSON.parse(fs.readFileSync('scan_stats.json', 'utf8'));
    console.log(`Loaded existing stats: ${stats.totalOrders} orders, ${Math.round(stats.totalRevenue)} RUB.`);
  }
  if (fs.existsSync('toolbox_customer_emails.json')) {
    const existing = JSON.parse(fs.readFileSync('toolbox_customer_emails.json', 'utf8'));
    existing.forEach(e => emails.add(e));
    console.log(`Loaded ${emails.size} unique emails.`);
  }

  // Calculate Resume Page
  // We process 15 orders per page. 
  const totalPages = 79020;
  const processedPages = Math.floor(stats.totalOrders / 15);
  const resumePage = totalPages - processedPages;
  
  console.log(`Resuming from page ${resumePage} down to 1...`);

  let queue = Array.from({ length: resumePage }, (_, i) => resumePage - i);
  let processedInThisRun = 0;
  const concurrency = 20;

  const worker = async (id) => {
    const page = await context.newPage();
    await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}', route => route.abort());

    while (queue.length > 0) {
      const pageNum = queue.shift();
      if (!pageNum || pageNum < 1) break;

      try {
        await page.goto(`https://panel.smmtoolbox.ru/admin/orders?page=${pageNum}&site_id=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        const data = await page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('table tbody tr'));
          return rows.map(row => {
            const cols = Array.from(row.querySelectorAll('td'));
            if (cols.length < 5) return null;
            const infoText = cols[2].innerText;
            return {
              email: cols[1].innerText.trim(),
              category: (infoText.match(/Категория:\s*(.*)/) || [])[1] || 'Unknown',
              service: (infoText.match(/Сервис:\s*(.*)/) || [])[1] || 'Unknown',
              price: cols[3].innerText.trim(),
              month: (infoText.match(/Дата создания:\s*(\d{4}-\d{2})/) || [])[1] || 'Unknown',
              text: row.innerText
            };
          }).filter(r => r !== null);
        });

        data.forEach(o => {
          const p = parseFloat(o.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
          stats.totalRevenue += p;
          stats.totalOrders += 1;
          if (o.month !== 'Unknown') {
            if (!stats.byMonth[o.month]) stats.byMonth[o.month] = { revenue: 0, count: 0 };
            stats.byMonth[o.month].revenue += p;
            stats.byMonth[o.month].count += 1;
          }
          stats.popularServices[o.service] = (stats.popularServices[o.service] || 0) + 1;
          stats.popularCategories[o.category] = (stats.popularCategories[o.category] || 0) + 1;
          if (o.email.includes('@')) emails.add(o.email.toLowerCase());
          const eMatches = o.text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
          if (eMatches) eMatches.forEach(e => emails.add(e.toLowerCase()));
        });

        processedInThisRun++;
        if (processedInThisRun % 100 === 0) {
          console.log(`[Total: ${stats.totalOrders}] Page ${pageNum} | Rev: ${Math.round(stats.totalRevenue)} RUB | Emails: ${emails.size}`);
          if (processedInThisRun % 500 === 0) {
            fs.writeFileSync('scan_stats.json', JSON.stringify(stats, null, 2));
            fs.writeFileSync('toolbox_customer_emails.json', JSON.stringify(Array.from(emails)));
          }
        }
      } catch (e) {
        queue.push(pageNum);
      }
    }
    await page.close();
  };

  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i)));
  fs.writeFileSync('scan_stats_final.json', JSON.stringify(stats, null, 2));
  console.log('--- ALL PAGES PROCESSED ---');
  await browser.close();
})();

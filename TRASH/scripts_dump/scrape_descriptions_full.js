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

  const servicesData = JSON.parse(fs.readFileSync('toolbox_services_site1_full.json', 'utf8'));
  console.log(`Starting full scrape of ${servicesData.length} descriptions...`);
  
  const results = [];
  let count = 0;

  for (const service of servicesData) {
    count++;
    const detailUrl = `https://panel.smmtoolbox.ru/admin/services/${service.id}/short?site_id=1`;
    
    if (count % 10 === 0) {
        console.log(`Progress: ${count}/${servicesData.length}...`);
    }

    try {
      await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      const description = await page.evaluate(() => {
        const selectors = [
            'textarea[name="description"]',
            '#description',
            '.block-content textarea',
            'div.form-group:has(label:text("Описание")) div'
        ];
        
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) return el.value || el.innerText.trim();
        }
        
        const labels = Array.from(document.querySelectorAll('label'));
        const descLabel = labels.find(l => l.innerText.includes('Описание'));
        if (descLabel) {
            const container = descLabel.closest('.form-group');
            if (container) {
                const input = container.querySelector('textarea, input, div.form-control-static');
                if (input) return input.value || input.innerText.trim();
            }
        }
        return 'No description';
      });

      results.push({
        ...service,
        description: description
      });
      
    } catch (e) {
      console.error(`  Error on ID ${service.id}:`, e.message);
      results.push({ ...service, description: 'Error fetching' });
    }
  }

  fs.writeFileSync('toolbox_services_with_descriptions.json', JSON.stringify(results, null, 2));
  console.log(`DONE! Full data saved to toolbox_services_with_descriptions.json`);

  await browser.close();
})();

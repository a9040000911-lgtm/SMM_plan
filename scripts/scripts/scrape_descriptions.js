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
  const sampleServices = servicesData.slice(0, 10); // Take first 10 for example
  const results = [];

  for (const service of sampleServices) {
    const detailUrl = `https://panel.smmtoolbox.ru/admin/services/${service.id}/short?site_id=1`;
    console.log(`Fetching description for ID ${service.id}: ${detailUrl}`);
    
    try {
      await page.goto(detailUrl, { waitUntil: 'networkidle' });
      
      const description = await page.evaluate(() => {
        // Try common selectors for description in such panels
        // Often it's in a textarea or a specific div
        const selectors = [
            'textarea[name="description"]',
            '#description',
            '.block-content', 
            'div.form-group:has(label:text("Описание")) div'
        ];
        
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) return el.value || el.innerText.trim();
        }
        
        // Fallback: search for label "Описание" and get next sibling or parent's child
        const labels = Array.from(document.querySelectorAll('label'));
        const descLabel = labels.find(l => l.innerText.includes('Описание'));
        if (descLabel) {
            const container = descLabel.closest('.form-group');
            if (container) {
                const input = container.querySelector('textarea, input, div.form-control-static');
                if (input) return input.value || input.innerText.trim();
            }
        }

        return 'Description not found';
      });

      results.push({
        id: service.id,
        name: service.name,
        description: description
      });
      
      console.log(`  Found: ${description.substring(0, 50)}...`);
    } catch (e) {
      console.error(`  Error fetching ID ${service.id}:`, e.message);
    }
  }

  fs.writeFileSync('toolbox_descriptions_sample.json', JSON.stringify(results, null, 2));
  console.log('Sample descriptions saved to toolbox_descriptions_sample.json');

  await browser.close();
})();

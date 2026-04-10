const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
    const b = await chromium.launch({ headless: true });
    const p = await b.newPage();
    await p.goto('https://panel.smmtoolbox.ru/admin/login');
    await p.fill('input[name=\"email\"]', 'a.sokolov@smm');
    await p.fill('input[name=\"password\"]', 'Ud5pgC-4uK');
    await p.click('button[type=\"submit\"]');
    await p.waitForSelector('#page-header-user-dropdown', { timeout: 15000 });
    await p.goto('https://panel.smmtoolbox.ru/admin/services/32/edit');
    await p.waitForTimeout(2000);
    const html = await p.content();
    fs.writeFileSync('d:/Smmplan/scripts/debug_edit_page.html', html);
    await b.close();
})();

const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1080 });
    
    // Login to admin panel
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForTimeout(1000);
    // (Assuming user is already logged in or we can bypass it, wait, we might need a cookie)
    
    // Easier way: let's use the browser subagent properly.
    await browser.close();
})();

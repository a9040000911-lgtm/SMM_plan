const fs = require('fs');
const path = require('path');

try {
    const data = JSON.parse(fs.readFileSync('scripts/telegram_users_scrape.json', 'utf8'));
    const list = [...new Set(data.map(u => u.username || u.userId))];
    fs.writeFileSync('scripts/telegram_list.txt', list.join('\n'));
    console.log(`Successfully extracted ${list.length} unique Telegram entries.`);
} catch (e) {
    console.error('Extraction failed:', e.message);
}

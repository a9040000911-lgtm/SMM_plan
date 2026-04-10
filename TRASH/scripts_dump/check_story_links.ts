import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'turbo_orders_data');
const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

let total = 0;
let failed = 0;
let linkS = 0; // t.me/user/s/123
let linkPost = 0; // t.me/user/123
let linkChannel = 0; // t.me/user
let sampleLinks = [];

for(const file of files) {
  const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
  const orders = JSON.parse(content);
  for(const o of orders) {
    if(o.service && o.service.includes('историю') && (o.category || '').includes('Telegram') && (o.activity || '').includes('Реакц')) {
      total++;
      if((o.status || '').includes('Отмен') || (o.status || '').toLowerCase().includes('cancel')) {
        failed++;
        const link = (o.link || '').toLowerCase().trim();
        if(link.includes('/s/')) {
          linkS++;
        } else {
            const parts = link.split('/');
            const lastPart = parts[parts.length - 1].split('?')[0];
            if (/^\d+$/.test(lastPart)) {
                linkPost++;
            } else {
                linkChannel++;
            }
            if(sampleLinks.length < 5) sampleLinks.push(link);
        }
      }
    }
  }
}

console.log(`=== АНАЛИЗ ОТМЕН REACTION НА ИСТОРИЮ (TELEGRAM) ===`);
console.log(`Всего отменено заказов: ${failed}`);
console.log(`Ссылки с маркером истории (/s/): ${linkS} (${((linkS/failed)*100).toFixed(1)}%)`);
console.log(`Ссылки на обычный ПОСТ (t.me/user/123): ${linkPost} (${((linkPost/failed)*100).toFixed(1)}%)`);
console.log(`Ссылки просто на КАНАЛ (t.me/user): ${linkChannel} (${((linkChannel/failed)*100).toFixed(1)}%)`);
console.log(`\nПримеры "косячных" ссылок юзеров:`);
sampleLinks.forEach(l => console.log(l));

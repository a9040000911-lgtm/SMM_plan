const fs = require('fs');

const data = JSON.parse(fs.readFileSync('all_canceled_orders.json', 'utf8'));

const examples = {
    tgPrivate: new Set(),
    instaWithParams: new Set(),
    vkMobile: new Set(),
    others: new Set()
};

data.forEach(o => {
    const link = o.link.trim();
    const l = link.toLowerCase();
    
    if ((l.includes('t.me/+') || l.includes('joinchat')) && examples.tgPrivate.size < 15) {
        examples.tgPrivate.add(link);
    } else if (l.includes('instagram.com') && l.includes('?') && examples.instaWithParams.size < 15) {
        examples.instaWithParams.add(link);
    } else if ((l.includes('m.vk.com') || l.includes('vk.com/m/')) && examples.vkMobile.size < 10) {
        examples.vkMobile.add(link);
    } else if (examples.others.size < 10) {
        examples.others.add(link);
    }
});

let output = '=== FAILED LINKS EXAMPLES FROM SMMTOOLBOX ===\n\n';

output += '--- 1. Telegram Private Links ---\n';
output += Array.from(examples.tgPrivate).join('\n') + '\n\n';

output += '--- 2. Instagram with Params (Garbage in URL) ---\n';
output += Array.from(examples.instaWithParams).join('\n') + '\n\n';

output += '--- 3. VK Mobile Links ---\n';
output += Array.from(examples.vkMobile).join('\n') + '\n\n';

output += '--- 4. Others ---\n';
output += Array.from(examples.others).join('\n');

fs.writeFileSync('example_failed_links.txt', output);
console.log('List of example links generated: example_failed_links.txt');
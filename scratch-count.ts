import fs from 'fs';
let data = fs.readFileSync('docs/vexboost_services.json', 'utf16le');
if (data.charCodeAt(0) === 0xFEFF) data = data.slice(1);
const parsed = JSON.parse(data);
console.log(Object.keys(parsed));
if (parsed.data) {
    console.log('Total items:', parsed.data.length);
    console.log('First item:', parsed.data[0]);
} else if (parsed.services) {
    console.log('Total items:', parsed.services.length);
    console.log('First item:', parsed.services[0]);
} else if (Array.isArray(parsed)) {
    console.log('Array total items:', parsed.length);
    console.log('First item:', parsed[0]);
} else {
    // maybe it's just keys?
    const vals = Object.values(parsed);
    console.log('Vals:', vals.length);
    console.log('First:', vals[0]);
}

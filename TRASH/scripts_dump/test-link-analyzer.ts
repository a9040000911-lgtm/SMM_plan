
import { analyzeLink } from '../src/utils/analyzer';
import * as fs from 'fs';

const content = fs.readFileSync('example_failed_links.txt', 'utf-8');
const lines = content.split('\n');

console.log('| Ссылка | Платформа | Тип объекта | Категории | Примечание |');
console.log('| :--- | :--- | :--- | :--- | :--- |');

for (const line of lines) {
    const link = line.trim();
    if (!link || link.startsWith('===') || link.startsWith('---')) continue;

    try {
        const result = analyzeLink(link);
        if (result) {
            console.log(`| ${link} | ${result.platform} | ${result.objectType} | ${result.possibleCategories.join(', ')} | ${result.isPrivate ? 'PRIVATE' : ''} |`);
        } else {
            console.log(`| ${link} | ❌ NOT FOUND | - | - | - |`);
        }
    } catch (e: any) {
        console.log(`| ${link} | 💥 ERROR | ${e.message} | - | - |`);
    }
}

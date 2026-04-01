import fs from 'fs';
import path from 'path';
import { distance } from 'fastest-levenshtein';

// Мы проверяем папку с базовыми UI-компонентами, так как именно там ИИ чаще всего плодит дубликаты
const UI_DIR = path.join(process.cwd(), 'src', 'components', 'ui');

if (!fs.existsSync(UI_DIR)) {
  console.log('Папка UI не найдена. Пропуск проверки.');
  process.exit(0);
}

const files = fs.readdirSync(UI_DIR).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
const fileNames = files.map(f => f.replace(/\.tsx?$/, '').toLowerCase());

let hasDuplicates = false;

console.log('🔍 Запуск проверки Anti-Duplication Protocol...');

for (let i = 0; i < fileNames.length; i++) {
  for (let j = i + 1; j < fileNames.length; j++) {
    const nameA = fileNames[i];
    const nameB = fileNames[j];
    
    const dist = distance(nameA, nameB);
    const maxLen = Math.max(nameA.length, nameB.length);
    const similarity = (1 - dist / maxLen);

    // Если имена похожи на 80% и более (например, button и buttons, или input и inputs)
    if (similarity >= 0.80) {
      console.error(`\n🚨 ВНИМАНИЕ: Слишком похожие компоненты!`);
      console.error(`   👉 ${files[i]}`);
      console.error(`   👉 ${files[j]}`);
      console.error(`Вероятно, ИИ создал дубликат вместо переиспользования существующего кода.`);
      hasDuplicates = true;
    }
    
    // Проверка на вложенность слов (например, button и submit-button)
    // Оставляем как предупреждение, не ломаем билд, так как это может быть легально
    if (nameA.includes(nameB) || nameB.includes(nameA)) {
      if (nameA.length > 3 && nameB.length > 3) {
        // Чтобы не спамить, проверяем это тихо или выводим только желтым
        // console.warn(`⚠️ Подозреваемый дубликат по маске: ${files[i]} <-> ${files[j]}`);
      }
    }
  }
}

if (hasDuplicates) {
  console.error('\n❌ ПРОВЕРКА ПРОВАЛЕНА. Обнаружены дубликаты в UI-ките.');
  console.error('Пожалуйста, удалите лишний компонент и используйте существующий.');
  process.exit(1); // Роняет билд / CI / git hook
} else {
  console.log('✅ Проверка на дубликаты пройдена успешно. Чисто!');
}

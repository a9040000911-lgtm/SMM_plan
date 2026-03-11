import { SmartAnalyzerLogic } from '../src/services/providers/smart-analyzer.logic';

const name = "Telegram Подписчики [Гарантия - 3 дня♻️] [Кнопка восстановления] [Крупные списания⛔️]";
const description = "Аккаунты оформлены \nГео микс\nВозможны списания до 10%\n\nЖелаем приятных заказов и хорошего настроения";
const category = "Telegram Подписчики";

const result = SmartAnalyzerLogic.detectSync(name, description, category);
const nVal = name.toLowerCase();
const cVal = category.toLowerCase();

console.log('Result targetType:', result.targetType);
console.log('nVal.includes("буст"):', nVal.includes('буст'));
console.log('cVal.includes("буст"):', cVal.includes('буст'));

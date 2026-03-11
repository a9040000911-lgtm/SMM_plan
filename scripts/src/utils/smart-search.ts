/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { distance } from 'fastest-levenshtein';

/**
 * Умный поиск:
 * 1. Игнорирует порядок слов.
 * 2. Устойчив к опечаткам (Levenshtein distance).
 * 3. Требует вхождения всех ключевых слов запроса.
 */
export function smartSearch(query: string, text: string): boolean {
    if (!query) return true;
    if (!text) return false;

    const qWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const tWords = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);

    // Для каждого слова из запроса должно найтись соответствие в тексте
    return qWords.every(qWord => {
        // 1. Прямое вхождение или префикс
        if (tWords.some(tWord => tWord.includes(qWord))) return true;

        // 2. Опечатки (только для слов > 3 символов)
        if (qWord.length > 3) {
            const threshold = qWord.length > 6 ? 2 : 1;
            if (tWords.some(tWord => {
                // Пытаемся найти похожее слово или подстроку в длинных словах
                if (tWord.length >= qWord.length) {
                    // Проверяем скользящим окном для длинных слов
                    for (let i = 0; i <= tWord.length - qWord.length; i++) {
                        const sub = tWord.substring(i, i + qWord.length);
                        if (distance(qWord, sub) <= threshold) return true;
                    }
                } else {
                    if (distance(qWord, tWord) <= threshold) return true;
                }
                return false;
            })) return true;
        }

        return false;
    });
}

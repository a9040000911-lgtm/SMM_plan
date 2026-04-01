/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

const cyrillicToLatinMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
};

export function slugify(text: string): string {
    if (!text) return '';

    // 1. Convert to lowercase
    let lower = text.toLowerCase();

    // 2. Transliterate Cyrillic to Latin
    let transliterated = '';
    for (let i = 0; i < lower.length; i++) {
        const char = lower[i];
        transliterated += cyrillicToLatinMap[char] !== undefined ? cyrillicToLatinMap[char] : char;
    }

    // 3. Replace non-alphanumeric (Latin) with separator
    let slug = transliterated.replace(/[^a-z0-9]+/g, '-');

    // 4. Remove leading/trailing hyphens
    return slug.replace(/^-+|-+$/g, '');
}

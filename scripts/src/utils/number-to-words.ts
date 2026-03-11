/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export function numberToWordsRu(price: number): string {
    const rubles = Math.floor(price);
    const kopecks = Math.round((price - rubles) * 100);

    const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const unitsFemale = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
    const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
    const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
    const thousands = ['', 'тысяча', 'тысячи', 'тысяч'];

    if (rubles === 0) {
        return `Ноль рублей ${kopecks > 0 ? `${kopecks.toString().padStart(2, '0')} ${getKopeckWord(kopecks)}` : ''}`.trim();
    }

    const words: string[] = [];

    const th = Math.floor(rubles / 1000);
    const rem = rubles % 1000;

    if (th > 0) {
        const h = Math.floor(th / 100);
        const t = Math.floor((th % 100) / 10);
        const u = th % 10;

        if (h > 0) words.push(hundreds[h]);
        if (t === 1) words.push(teens[u]);
        else {
            if (t > 1) words.push(tens[t]);
            if (u > 0) words.push(unitsFemale[u]); // Thousands are feminine in Russian
        }

        if (t === 1) words.push(thousands[3]);
        else if (u === 1) words.push(thousands[1]);
        else if (u >= 2 && u <= 4) words.push(thousands[2]);
        else words.push(thousands[3]);
    }

    if (rem > 0 || words.length === 0) {
        const h = Math.floor(rem / 100);
        const t = Math.floor((rem % 100) / 10);
        const u = rem % 10;

        if (h > 0) words.push(hundreds[h]);
        if (t === 1) words.push(teens[u]);
        else {
            if (t > 1) words.push(tens[t]);
            if (u > 0) words.push(units[u]); // Rubles are masculine
        }
    }

    const rublesStr = words.join(' ').trim();
    const rublesWord = getRubleWord(rubles);
    const kopecksWord = getKopeckWord(kopecks);

    // Capitalize first letter
    const finalRublesStr = rublesStr.charAt(0).toUpperCase() + rublesStr.slice(1);

    return `${finalRublesStr} ${rublesWord} ${kopecks > 0 ? `${kopecks.toString().padStart(2, '0')} ${kopecksWord}` : ''}`.trim();
}

function getRubleWord(num: number): string {
    const n = Math.abs(num) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return 'рублей';
    if (n1 > 1 && n1 < 5) return 'рубля';
    if (n1 === 1) return 'рубль';
    return 'рублей';
}

function getKopeckWord(num: number): string {
    const n = Math.abs(num) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return 'копеек';
    if (n1 > 1 && n1 < 5) return 'копейки';
    if (n1 === 1) return 'копейка';
    return 'копеек';
}

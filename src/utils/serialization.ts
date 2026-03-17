/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

/**
 * Сверхмощная утилита для сериализации объектов Prisma.
 * Решает проблему "Only plain objects can be passed to Client Components".
 * Автоматически конвертирует Decimal в number и BigInt в string.
 */
export function toPlainObject<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
        return obj.map(toPlainObject) as unknown as T;
    }

    if (typeof obj === 'bigint') {
        return (obj as any).toString() as unknown as T;
    }

    if (typeof obj === 'object') {
        // Если это Decimal (из Prisma)
        if ((obj as any).constructor?.name === 'Decimal' || typeof (obj as any).toFixed === 'function') {
            return (obj as any).toString() as unknown as T;
        }

        // Если это Date
        if (obj instanceof Date) {
            return obj as unknown as T; // Даты Next.js умеет передавать
        }

        // Рекурсивно обрабатываем все ключи
        const newObj: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = toPlainObject(obj[key]);
            }
        }
        return newObj as T;
    }

    return obj;
}

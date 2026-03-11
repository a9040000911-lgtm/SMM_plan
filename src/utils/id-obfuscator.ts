/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

/**
 * Simple ID Obfuscator (Base62 + Offset)
 * Converts sequential integers like 1, 2, 3 into non-obvious strings like 'X7b8', 'A4k1', etc.
 * This is used to hide the total volume of orders/transactions from public view.
 */

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const BASE = ALPHABET.length;
const OFFSET = 1000000; // Start obfuscation from a large number to ensure consistent length
const SALT = 4321;      // Simple multiplier to make it non-sequential

export function encodePublicId(id: number): string {
    // Apply shift and salt to hide sequence
    let n = (id + OFFSET) * SALT;
    let result = '';

    while (n > 0) {
        result = ALPHABET[n % BASE] + result;
        n = Math.floor(n / BASE);
    }

    return result;
}

/**
 * Note: Decoding is possible but usually not needed for client-side display.
 * We store the real ID in the DB and only show this encoded version to the user.
 * If we need to find an order by Public ID, we can decode it:
 */
export function decodePublicId(encoded: string): number {
    let n = 0;
    for (let i = 0; i < encoded.length; i++) {
        n = n * BASE + ALPHABET.indexOf(encoded[i]);
    }
    return Math.round(n / SALT) - OFFSET;
}

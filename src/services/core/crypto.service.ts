/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import * as crypto from 'crypto';

/**
 * CryptoService for Field-Level Encryption (FLE)
 * Uses AES-256-GCM for strong encryption and integrity checks.
 */
export class CryptoService {
    private static readonly ALGORITHM = 'aes-256-gcm';
    private static readonly IV_LENGTH = 16; // bytes
    private static readonly AUTH_TAG_LENGTH = 16; // bytes

    private static getEncryptionKey(): Buffer {
        const secret = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
        if (!secret) {
            throw new Error('ENCRYPTION_KEY or NEXTAUTH_SECRET is not defined in environment.');
        }
        // Deriving a 32-byte key from the secret
        return crypto.createHash('sha256').update(secret).digest();
    }

    /**
     * Encrypts a string value.
     * Returns a format: iv:authTag:encryptedValue (all hex)
     */
    static encrypt(text: string): string {
        if (!text) return text;

        const iv = crypto.randomBytes(this.IV_LENGTH);
        const key = this.getEncryptionKey();
        const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag().toString('hex');

        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    }

    /**
     * Decrypts an encrypted string.
     * Supports fallback to plain text if the format doesn't match.
     */
    static decrypt(encryptedText: string): string {
        if (!encryptedText) return encryptedText;

        const parts = encryptedText.split(':');
        if (parts.length !== 3) {
            // Not in FLE format, assume it's plain text (fallback for old data)
            return encryptedText;
        }

        try {
            const [ivHex, authTagHex, encryptedValue] = parts;
            const key = this.getEncryptionKey();

            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');

            const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encryptedValue, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            console.error('[CryptoService] Decryption failed:', error);
            // If decryption fails, it might be plain text that accidentally had colons
            return encryptedText;
        }
    }

    /**
     * Utility to encrypt JSON objects.
     */
    static encryptJson(obj: any): string | null {
        if (!obj) return null;
        return this.encrypt(JSON.stringify(obj));
    }

    /**
     * Utility to decrypt JSON objects.
     */
    static decryptJson<T>(encryptedJson: string): T | null {
        if (!encryptedJson) return null;
        const decrypted = this.decrypt(encryptedJson);
        try {
            return JSON.parse(decrypted) as T;
        } catch {
            return null;
        }
    }
}

/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { createHash, createHmac, timingSafeEqual } from 'crypto';

export interface TelegramUserData {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    language_code?: string;
    is_premium?: boolean;
}

export interface TelegramAuthData extends Omit<TelegramUserData, 'language_code' | 'is_premium'> {
    auth_date: number;
    hash: string;
}

export interface TMAInitData {
    auth_date: number;
    query_id?: string;
    user?: TelegramUserData;
    hash: string;
    [key: string]: any;
}

export class TelegramAuth {
    /**
     * Валидирует данные от Telegram Login Widget (для входа через виджет на сайте)
     */
    static validateWidgetData(data: TelegramAuthData, botToken: string): boolean {
        const { hash, ...rest } = data;

        const checkString = Object.entries(rest)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        const secretKey = createHash('sha256').update(botToken).digest();
        const hmac = createHmac('sha256', secretKey).update(checkString).digest('hex');

        // Проверка на свежесть (2 часа)
        const isExpired = (Math.floor(Date.now() / 1000) - data.auth_date) > 7200;

        let isValidHash = false;
        try {
            const a = Buffer.from(hmac);
            const b = Buffer.from(hash || '');
            if (a.length === b.length) {
                isValidHash = timingSafeEqual(a, b);
            }
        } catch (e) {}

        return isValidHash && !isExpired;
    }

    /**
     * Валидирует initData от Telegram Web App (TMA)
     */
    static validateTMAData(initData: string, botToken: string): { isValid: boolean; data?: TMAInitData; error?: string } {
        try {
            const urlParams = new URLSearchParams(initData);
            const hash = urlParams.get('hash');
            if (!hash) return { isValid: false, error: 'Hash missing' };

            const data: Record<string, string> = {};
            urlParams.sort();
            urlParams.forEach((value, key) => {
                if (key !== 'hash') {
                    data[key] = value;
                }
            });

            const dataCheckString = Object.entries(data)
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');

            const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
            const calculatedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

            let isValidHash = false;
            try {
                const a = Buffer.from(calculatedHash);
                const b = Buffer.from(hash);
                if (a.length === b.length) {
                    isValidHash = timingSafeEqual(a, b);
                }
            } catch (e) {}

            if (!isValidHash) {
                return { isValid: false, error: 'Hash mismatch' };
            }

            const authDate = parseInt(data['auth_date'] || '0');
            const now = Math.floor(Date.now() / 1000);
            if (now - authDate > 7200) {
                return { isValid: false, error: 'Data is stale' };
            }

            const tmaData: TMAInitData = {
                ...data,
                auth_date: authDate,
                hash: hash,
                user: data['user'] ? JSON.parse(data['user']) : undefined
            };

            return { isValid: true, data: tmaData };
        } catch (e: any) {
            return { isValid: false, error: e.message };
        }
    }
}



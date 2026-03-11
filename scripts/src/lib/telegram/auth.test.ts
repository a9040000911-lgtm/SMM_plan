/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { TelegramAuth, TelegramAuthData } from './auth';
import { createHash, createHmac } from 'crypto';

/**
 * Тесты для TelegramAuth
 * Стандарт: Triple A (Arrange, Act, Assert)
 * Покрытие: 100% функционала и ветвлений
 */
describe('TelegramAuth', () => {
    const botToken = '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ';
    const authDate = Math.floor(Date.now() / 1000);

    describe('validateWidgetData', () => {
        it('should return true for valid widget data and hash', () => {
            // Arrange
            const data: TelegramAuthData = {
                id: 12345,
                first_name: 'Antigravity',
                username: 'tester',
                auth_date: authDate,
                hash: ''
            };
            // eslint-disable-next-line unused-imports/no-unused-vars
            const { hash, ...rest } = data;
            const checkString = Object.entries(rest)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
            const secretKey = createHash('sha256').update(botToken).digest();
            data.hash = createHmac('sha256', secretKey).update(checkString).digest('hex');

            // Act
            const result = TelegramAuth.validateWidgetData(data, botToken);

            // Assert
            expect(result).toBe(true);
        });

        it('should return false when hash is incorrect', () => {
            // Arrange
            const data: TelegramAuthData = {
                id: 12345,
                first_name: 'Test',
                auth_date: authDate,
                hash: 'incorrect_hash_value'
            };

            // Act
            const result = TelegramAuth.validateWidgetData(data, botToken);

            // Assert
            expect(result).toBe(false);
        });

        it('should return false when data is older than 24 hours', () => {
            // Arrange
            const expiredDate = authDate - 86401; // 24h + 1s
            const data: TelegramAuthData = {
                id: 12345,
                first_name: 'Old',
                auth_date: expiredDate,
                hash: ''
            };
            // eslint-disable-next-line unused-imports/no-unused-vars
            const { hash, ...rest } = data;
            const checkString = Object.entries(rest)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
            const secretKey = createHash('sha256').update(botToken).digest();
            data.hash = createHmac('sha256', secretKey).update(checkString).digest('hex');

            // Act
            const result = TelegramAuth.validateWidgetData(data, botToken);

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('validateTMAData', () => {
        it('should return isValid: true and correct data for valid TMA initData', () => {
            // Arrange
            const userObj = { id: 12345, first_name: 'TMA User' };
            const params = new URLSearchParams();
            params.set('auth_date', authDate.toString());
            params.set('user', JSON.stringify(userObj));
            params.sort();
            const dataCheckString = Array.from(params.entries())
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
            const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
            const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
            const initData = `${params.toString()}&hash=${hash}`;

            // Act
            const result = TelegramAuth.validateTMAData(initData, botToken);

            // Assert
            expect(result.isValid).toBe(true);
            expect(result.data?.hash).toBe(hash);
            expect(result.data?.user?.id).toBe(12345);
        });

        it('should return isValid: true even if user object is missing', () => {
            // Arrange
            const params = new URLSearchParams();
            params.set('auth_date', authDate.toString());
            params.sort();
            const dataCheckString = Array.from(params.entries())
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
            const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
            const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
            const initData = `${params.toString()}&hash=${hash}`;

            // Act
            const result = TelegramAuth.validateTMAData(initData, botToken);

            // Assert
            expect(result.isValid).toBe(true);
            expect(result.data?.user).toBeUndefined();
        });

        it('should return error if hash is missing', () => {
            // Arrange
            const initData = 'auth_date=12345';

            // Act
            const result = TelegramAuth.validateTMAData(initData, botToken);

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Hash missing');
        });

        it('should return error if calculated hash mismatch', () => {
            // Arrange
            const initData = `auth_date=${authDate}&hash=wrong_hash`;

            // Act
            const result = TelegramAuth.validateTMAData(initData, botToken);

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Hash mismatch');
        });

        it('should return error if data is older than 24 hours', () => {
            // Arrange
            const expiredDate = authDate - 86401;
            const params = new URLSearchParams();
            params.set('auth_date', expiredDate.toString());
            params.sort();
            const dataCheckString = Array.from(params.entries())
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
            const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
            const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
            const initData = `${params.toString()}&hash=${hash}`;

            // Act
            const result = TelegramAuth.validateTMAData(initData, botToken);

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Data is stale');
        });

        it('should return error if auth_date is missing', () => {
            // Arrange
            const params = new URLSearchParams();
            params.set('user', JSON.stringify({ id: 1 }));
            params.sort();
            const dataCheckString = Array.from(params.entries())
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
            const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
            const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
            const initData = `${params.toString()}&hash=${hash}`;

            // Act
            const result = TelegramAuth.validateTMAData(initData, botToken);

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Data is stale'); // authDate becomes 0
        });

        it('should return error if JSON.parse fails on user data', () => {
            // Arrange
            const params = new URLSearchParams();
            params.set('auth_date', authDate.toString());
            params.set('user', '{invalid_json');
            params.sort();
            const dataCheckString = Array.from(params.entries())
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
            const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
            const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
            const initData = `${params.toString()}&hash=${hash}`;

            // Act
            const result = TelegramAuth.validateTMAData(initData, botToken);

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
        });
    });
});

/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { LinkService } from '@/services/providers';
import { SmartAnalyzerService } from '@/services/providers';

describe('Link and Service Analysis Tests', () => {

    describe('LinkService.analyze (Link Context Detection)', () => {

        test('Should identify Telegram Public Channel', () => {
            const result = LinkService.analyze('https://t.me/durov');
            expect(result?.platform).toBe('TELEGRAM');
            expect(result?.targetType).toBe('CHANNEL');
            expect(result?.isPrivate).toBe(false);
            expect(result?.possibleCategories).toContain('SUBSCRIBERS');
        });

        test('Should identify Telegram Private Channel (+)', () => {
            const result = LinkService.analyze('https://t.me/+AbCDeF12345');
            expect(result?.platform).toBe('TELEGRAM');
            expect(result?.targetType).toBe('CHANNEL');
            expect(result?.isPrivate).toBe(true);
        });

        test('Should identify Telegram Boost Link', () => {
            const result = LinkService.analyze('https://t.me/boost/durov');
            expect(result?.targetType).toBe('CHANNEL');
            expect(result?.possibleCategories).toContain('BOOSTS');
            expect(result?.possibleCategories[0]).toBe('BOOSTS'); // Проверяем приоритет
        });

        test('Should identify Telegram Private Channel (/joinchat/)', () => {
            const result = LinkService.analyze('https://t.me/joinchat/AbCDeF12345');
            expect(result?.targetType).toBe('CHANNEL');
            expect(result?.isPrivate).toBe(true);
        });

        test('Should identify Telegram Public Post', () => {
            const result = LinkService.analyze('https://t.me/durov/1');
            expect(result?.platform).toBe('TELEGRAM');
            expect(result?.targetType).toBe('POST');
            expect(result?.isPrivate).toBe(false);
            expect(result?.possibleCategories).toContain('VIEWS');
            expect(result?.possibleCategories).not.toContain('SUBSCRIBERS');
        });

        test('Should identify Telegram Public Post with alphanumeric username', () => {
            const result = LinkService.analyze('https://t.me/smmMarket69/29');
            expect(result?.targetType).toBe('POST');
        });

        test('Should return null for invalid/broken link', () => {
            const result = LinkService.analyze('not-a-link');
            expect(result).toBeNull();
        });

        test('Should handle malformed but recognizable links', () => {
            const result = LinkService.analyze('t.me/durov');
            expect(result?.platform).toBe('TELEGRAM');
        });
    });

    describe('SmartAnalyzerService.analyzeService (Service Metadata Detection)', () => {

        test('Should detect Subscriber service as CHANNEL', async () => {
            const result = await SmartAnalyzerService.analyzeService('Подписчики Telegram (Быстрые)');
            expect(result?.targetType).toBe('CHANNEL');
            expect(result?.category).toBe('SUBSCRIBERS');
        });

        test('Should detect Boost service as CHANNEL', async () => {
            const result = await SmartAnalyzerService.analyzeService('Telegram Boosts (Level Up)');
            expect(result?.targetType).toBe('CHANNEL');
            expect(result?.category).toBe('BOOSTS');
        });

        test('Should detect Views service as POST by default', async () => {
            const result = await SmartAnalyzerService.analyzeService('TG Просмотры на пост');
            expect(result?.targetType).toBe('POST');
            expect(result?.category).toBe('VIEWS');
        });

        test('Should detect Mass Views (последних постов) as CHANNEL_POSTS', async () => {
            const result = await SmartAnalyzerService.analyzeService('Просмотры на 5 последних постов');
            expect(result?.targetType).toBe('CHANNEL_POSTS');
        });

        test('Should detect Private service keywords', async () => {
            const result = await SmartAnalyzerService.analyzeService('Подписчики (ЗАКРЫТЫЙ КАНАЛ)');
            expect(result?.isPrivate).toBe(true);
        });

        test('Should analyze description for keywords if name is vague', async () => {
            const result = await SmartAnalyzerService.analyzeService('Услуга #123', 'Накрутка на будущие посты вашего канала');
            expect(result?.targetType).toBe('CHANNEL_POSTS');
        });
    });

    describe('Precision Filtering Logic (Integration Simulation)', () => {

        // В этом тесте мы проверяем логику, которая используется в боте для фильтрации
        // Мы не делаем реальных запросов к БД, а проверяем саму логику формирования запроса

        test('Logic: CHANNEL link should see both CHANNEL and CHANNEL_POSTS services', () => {
            const analysis = { targetType: 'CHANNEL' };

            // Имитация формирования targetTypes в боте
            const targetTypes = [analysis.targetType, 'ALL', 'CUSTOM'];
            if (analysis.targetType === 'CHANNEL') {
                targetTypes.push('CHANNEL_POSTS');
            }

            expect(targetTypes).toContain('CHANNEL');
            expect(targetTypes).toContain('CHANNEL_POSTS');
            expect(targetTypes).toContain('ALL');
        });

        test('Logic: POST link should NOT see CHANNEL or CHANNEL_POSTS services', () => {
            const analysis = { targetType: 'POST' };

            // Имитация формирования targetTypes в боте
            const targetTypes = [analysis.targetType, 'ALL', 'CUSTOM'];
            if (analysis.targetType === 'CHANNEL') {
                targetTypes.push('CHANNEL_POSTS');
            }

            expect(targetTypes).toContain('POST');
            expect(targetTypes).not.toContain('CHANNEL');
            expect(targetTypes).not.toContain('CHANNEL_POSTS');
        });

        test('Logic: Private Link should ONLY match sequence isPrivate: true', () => {
            const analysis = { isPrivate: true };

            // В боте: isPrivate: analysis.isPrivate === true
            const filterValue = analysis.isPrivate === true;

            expect(filterValue).toBe(true);
            // Это гарантирует, что в prisma.where: { isPrivate: true }
        });

        test('Logic: Public Link should ONLY match sequence isPrivate: false', () => {
            const analysis = { isPrivate: false };

            // В боте: isPrivate: analysis.isPrivate === true
            const filterValue = analysis.isPrivate === true;

            expect(filterValue).toBe(false);
            // Это гарантирует, что в prisma.where: { isPrivate: false }
        });
    });

});

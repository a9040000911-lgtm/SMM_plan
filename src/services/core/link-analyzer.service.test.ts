/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { LinkAnalyzerService } from './link-analyzer.service';
import { Provider } from '@/generated/client';

describe('LinkAnalyzerService', () => {
    describe('normalizeLink', () => {
        it('should add https:// if scheme is missing', () => {
            expect(LinkAnalyzerService.normalizeLink('t.me/durov')).toBe('https://t.me/durov');
            expect(LinkAnalyzerService.normalizeLink('youtube.com/watch?v=123')).toBe('https://youtube.com/watch?v=123');
        });

        it('should trim whitespace around the URL', () => {
            expect(LinkAnalyzerService.normalizeLink('  https://vk.com/durov  ')).toBe('https://vk.com/durov');
        });

        it('should remove tracking parameters (igsh, utm_*)', () => {
            expect(LinkAnalyzerService.normalizeLink('https://t.me/durov?igsh=12345&utm_source=telegram&utm_medium=cpc')).toBe('https://t.me/durov');
            expect(LinkAnalyzerService.normalizeLink('https://www.youtube.com/watch?v=123&utm_campaign=test')).toBe('https://www.youtube.com/watch?v=123');
        });

        it('should strip trailing slashes', () => {
            expect(LinkAnalyzerService.normalizeLink('https://t.me/durov/')).toBe('https://t.me/durov');
            expect(LinkAnalyzerService.normalizeLink('https://github.com/')).toBe('https://github.com');
        });

        it('should return original text if it is not a URL (fallback)', () => {
            expect(LinkAnalyzerService.normalizeLink('@durov_channel')).toBe('@durov_channel');
            expect(LinkAnalyzerService.normalizeLink('1234567')).toBe('1234567');
        });
    });

    describe('formatForProvider (Provider-Specific Transformations)', () => {
        const createMockProvider = (name: string, apiUrl: string): Provider => ({
            id: 'mock-id',
            name,
            apiUrl,
            apiKey: 'mock-key',
            isEnabled: true,
            type: 'OTHER'
        } as unknown as Provider);

        describe('Category: BOOSTS (TELEGRAM)', () => {
            const platform = 'TELEGRAM';
            const category = 'BOOSTS';

            it('should transform to /boost/ for SmmPanelUS', () => {
                const p = createMockProvider('SmmPanelUS', 'https://smmpanelus.com/api/v2');

                // Add boost
                expect(LinkAnalyzerService.formatForProvider('t.me/durov', platform, category, p)).toBe('https://t.me/boost/durov');
                expect(LinkAnalyzerService.formatForProvider('https://t.me/durov', platform, category, p)).toBe('https://t.me/boost/durov');

                // Remove existing ?boost and move to path
                expect(LinkAnalyzerService.formatForProvider('https://t.me/durov?boost', platform, category, p)).toBe('https://t.me/boost/durov');

                // Keep if already correct
                expect(LinkAnalyzerService.formatForProvider('https://t.me/boost/durov', platform, category, p)).toBe('https://t.me/boost/durov');
            });

            it('should transform to ?boost for SocRocket', () => {
                const p = createMockProvider('Soc-Rocket', 'https://soc-rocket.ru/api/v2');

                // Add ?boost
                expect(LinkAnalyzerService.formatForProvider('t.me/durov', platform, category, p)).toBe('https://t.me/durov?boost');

                // Remove /boost/ and change to ?boost
                expect(LinkAnalyzerService.formatForProvider('https://t.me/boost/durov', platform, category, p)).toBe('https://t.me/durov?boost');
            });

            it('should leave URL standardized for VexBoost (Flexible)', () => {
                const p = createMockProvider('VexBoost', 'https://vexboost.ru/api/v2');
                expect(LinkAnalyzerService.formatForProvider('https://t.me/durov', platform, category, p)).toBe('https://t.me/durov');
            });
        });

        describe('Category: BOOSTS/TRENDS (YOUTUBE)', () => {
            const platform = 'YOUTUBE';
            const category = 'BOOSTS';

            it('should add ?boost for SocRocket YT Boosts', () => {
                const p = createMockProvider('SocRocket', 'https://soc-rocket.ru/api/v2');
                expect(LinkAnalyzerService.formatForProvider('https://youtube.com/watch?v=123', platform, category, p)).toBe('https://youtube.com/watch?v=123&boost');
            });
        });

        describe('Other Categories / Providers', () => {
            it('should return normalized link without changes for general requests', () => {
                const p = createMockProvider('SomeProvider', 'https://api.com/v2');
                expect(LinkAnalyzerService.formatForProvider('t.me/durov/', 'TELEGRAM', 'SUBSCRIBERS', p)).toBe('https://t.me/durov');
            });
        });
    });

    describe('extractBotRequirementsFromDescription', () => {
        it('should return requiresBot false and empty instruction for missing or empty description', () => {
            expect(LinkAnalyzerService.extractBotRequirementsFromDescription(null)).toEqual({ requiresBot: false });
            expect(LinkAnalyzerService.extractBotRequirementsFromDescription('')).toEqual({ requiresBot: false });
        });

        it('should detect generic bot requirements as White-Label', () => {
            const result = LinkAnalyzerService.extractBotRequirementsFromDescription('Для этого заказа требуется бот в канал.');
            expect(result.requiresBot).toBe(true);
            expect(result.botInstruction).toContain('пригласить сервисного бота');
            expect(result.botInstruction).not.toContain('провайдер');
            expect(result.botInstruction).not.toContain('Провайдер');
        });

        it('should detect specific Discord bot requirements as White-Label', () => {
            const result = LinkAnalyzerService.extractBotRequirementsFromDescription('Пригласите бота nowon.tools на ваш сервер');
            expect(result.requiresBot).toBe(true);
            expect(result.botInstruction).toContain('нашего системного бота авторизации (nowon.tools');
            expect(result.botInstruction).not.toContain('провайдера');
        });

        it('should not false positive on normal descriptions', () => {
            const result = LinkAnalyzerService.extractBotRequirementsFromDescription('Быстрые подписчики без отписок. Гарантия 30 дней.');
            expect(result.requiresBot).toBe(false);
            expect(result.botInstruction).toBeUndefined();
        });
    });
});

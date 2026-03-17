/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { analyzeLink } from './analyzer';

describe('analyzeLink', () => {
    test('should recognize public Telegram channel', () => {
        const res = analyzeLink('https://t.me/durov');
        expect(res?.platform).toBe('TELEGRAM');
        expect(res?.objectType).toBe('TG_CHANNEL');
    });

    test('should recognize private Telegram link', () => {
        const res = analyzeLink('https://t.me/joinchat/ABCDEFG');
        expect(res?.platform).toBe('TELEGRAM');
        expect(res?.isPrivate).toBe(true);
        expect(res?.possibleCategories).toContain('SUBSCRIBERS');
    });

    test('should recognize Telegram post', () => {
        const res = analyzeLink('https://t.me/durov/123');
        expect(res?.platform).toBe('TELEGRAM');
        expect(res?.objectType).toBe('TG_POST');
        expect(res?.possibleCategories).toContain('VIEWS');
    });

    test('Recognizes Instagram Post', () => {
        const result = analyzeLink('https://www.instagram.com/p/C123456789/');
        expect(result?.platform).toBe('INSTAGRAM');
    });

    test('should recognize Twitch profile and stream', () => {
        const profile = analyzeLink('https://twitch.tv/gaules');
        expect(profile?.platform).toBe('TWITCH');
        expect(profile?.objectType).toBe('TW_CHANNEL');
    });

    test('should recognize Kick.com profile (returns OTHER)', () => {
        const res = analyzeLink('https://kick.com/trainwreckstv');
        // If not explicitly parsed by a specialized parser, returns OTHER
        expect(res?.platform).toBe('OTHER');
    });
});

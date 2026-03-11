/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { analyzeLink } from './analyzer';
import { Platform, Category } from '@/generated/client';

describe('Edge Cases (Survivor Bias Method)', () => {
  describe('Analyzer Edge Cases', () => {
    test('should handle root domain links without crash', () => {
      const res = analyzeLink('https://twitch.tv/');
      expect(res?.platform).toBe(Platform.TWITCH);
      expect(res?.objectType).toBe('TW_CHANNEL'); // Current implementation
    });

    test('should distinguish bot with start param from simple channel', () => {
      const res = analyzeLink('https://t.me/MyBot?start=ref123');
      expect(res?.possibleCategories).toContain(Category.REFERRALS);
      expect(res?.objectType).toBe('TG_BOT'); // Current implementation
    });

    test('should handle IP addresses as input (should return OTHER platform)', () => {
      const res = analyzeLink('http://127.0.0.1/test');
      expect(res).toMatchObject({
        platform: 'OTHER',
        objectType: 'WEB_SITE'
      });
    });
  });
});

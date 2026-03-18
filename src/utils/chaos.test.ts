/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { analyzeLink } from './analyzer';
import { normalizeLink } from './normalizer';

describe('Chaos & Chaos (Non-standard Methods)', () => {
  
  describe('Fuzz Testing (Trash Input)', () => {
    const trashInputs = [
      '', 
      '   ', 
      'null', 
      'undefined',
      '{}', 
      '[]',
      'A'.repeat(5000), // Extreme length
      'https://' + 'A'.repeat(5000), // Extreme URL
      '💩'.repeat(100), // Emojis
      'javascript:alert(1)', // XSS attempt
      'SELECT * FROM users', // SQLi attempt
      '\x00\x01\x02\x03', // Binary/Null bytes
      'https://t.me/!!!!!!!!!', // Invalid characters but looks like URL
    ];

    trashInputs.forEach((input, index) => {
      test(`should not crash on trash input #${index}`, () => {
        expect(() => {
          normalizeLink(input);
          analyzeLink(input);
        }).not.toThrow();
      });
    });
  });

  describe('Idempotency Testing', () => {
    const links = [
      'https://t.me/durov?start=123',
      'https://twitch.tv/user',
      'https://youtube.com/watch?v=dQw4w9WgXcQ',
      'https://m.vk.com/wall-1_123',
    ];

    links.forEach(link => {
      test(`normalization of ${link} should be idempotent`, () => {
        const firstPass = normalizeLink(link);
        const secondPass = normalizeLink(firstPass);
        const thirdPass = normalizeLink(secondPass);
        
        expect(secondPass).toBe(firstPass);
        expect(thirdPass).toBe(firstPass);
      });
    });
  });

  describe('Performance / ReDoS Check', () => {
    test('should process deep path link quickly', () => {
      const start = Date.now();
      const complexLink = 'https://t.me/' + 'a/'.repeat(100) + '123';
      normalizeLink(complexLink);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50); // Should be almost instant
    });
  });

  describe('Cross-Consistency check', () => {
      test('analyzer should return same platform after normalization', () => {
          const rawLink = 'HTTPS://WWW.TWITCH.TV/GAULES?utm=junk';
          const normalized = normalizeLink(rawLink);
          
          const rawAnalysis = analyzeLink(rawLink);
          const normalizedAnalysis = analyzeLink(normalized);
          
          expect(normalizedAnalysis?.platform).toBe(rawAnalysis?.platform);
          expect(normalized).not.toContain('WWW.');
          expect(normalized).not.toContain('utm');
      });
  });
});



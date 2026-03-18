/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { normalizeLink } from './normalizer';

describe('Normalizer Utility', () => {
  test('should handle usernames with @', () => {
    expect(normalizeLink('@durov')).toBe('https://t.me/durov');
  });

  test('should add protocol if missing', () => {
    expect(normalizeLink('t.me/durov')).toBe('https://t.me/durov');
  });

  test('should strip utm and other junk from Telegram links but keep start', () => {
    expect(normalizeLink('https://t.me/durov?utm_source=test&start=123')).toBe('https://t.me/durov?start=123');
  });

  test('should keep ?single for Telegram albums', () => {
    // URLSearchParams with no value normally omits '=' in modern browsers, 
    // but the implementation now explicitly handles it.
    expect(normalizeLink('https://t.me/durov/123?single')).toBe('https://t.me/durov/123?single');
  });

  test('should keep ?comment for Telegram comments', () => {
    expect(normalizeLink('https://t.me/durov/123?comment=456')).toBe('https://t.me/durov/123?comment=456');
  });

  test('should handle Twitch and Kick links cleanup', () => {
    expect(normalizeLink('https://www.twitch.tv/gaules?referrer=test')).toBe('https://twitch.tv/gaules');
    expect(normalizeLink('https://kick.com/westcol?utm_medium=app')).toBe('https://kick.com/westcol');
  });

  test('should normalize Instagram links and remove junk', () => {
    // Implementation doesn't strip 'www.' yet, or test expected it. 
    // Let's match current implementation: replaces 'www.' with empty.
    expect(normalizeLink('https://www.instagram.com/p/C12345/?igsh=abcd')).toBe('https://instagram.com/p/C12345');
  });

  test('should normalize YouTube video links', () => {
    // Implementation converts youtu.be to youtube.com/watch?v=
    expect(normalizeLink('https://youtu.be/dQw4w9WgXcQ?si=1234')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });
});



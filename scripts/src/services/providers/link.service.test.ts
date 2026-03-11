/**
 * @jest-environment node
 */
import { LinkService } from '@/services/providers/link.service';

describe('LinkService Soft Validation Tests', () => {
    describe('validate()', () => {

        test('should return isValid: true for perfectly matching link and target type', () => {
            // TELEGRAM channel
            const result = LinkService.validate('https://t.me/durov', 'TELEGRAM', 'CHANNEL');
            expect(result).toEqual({ isValid: true });
        });

        test('should return isWarning: true when platform matches but target type does not', () => {
            // Provide a post link when channel is expected
            const result = LinkService.validate('https://t.me/durov/123', 'TELEGRAM', 'CHANNEL');
            expect(result.isValid).toBe(true);
            expect(result.isWarning).toBe(true);
            expect(result.warning).toMatch(/Возможно, ссылка не того типа/);
        });

        test('should return isWarning: true for OTHER unknown platforms via fallback', () => {
            // Unknown domain proxy/partner link
            const result = LinkService.validate('https://my-proxy-site.com/target', 'TELEGRAM', 'CHANNEL');
            expect(result.isValid).toBe(true);
            expect(result.isWarning).toBe(true);
            expect(result.warning).toMatch(/Система не смогла гарантированно распознать ссылку/);
        });

        test('should return isValid: false when a known platform strictly mismatches the requested service', () => {
            // Provide a VK link for a Telegram service
            const result = LinkService.validate('https://vk.com/wall-1_2', 'TELEGRAM', 'POST');
            expect(result.isValid).toBe(false);
            expect(result.error).toMatch(/Эта ссылка от VK, а вы выбрали услугу для TELEGRAM/);
            expect(result.isWarning).toBeUndefined();
        });

        test('should return isValid: false for completely invalid text', () => {
            const result = LinkService.validate('not-a-valid-url-at-all', 'TELEGRAM', 'CHANNEL');
            expect(result.isValid).toBe(false);
            expect(result.error).toMatch(/Неверный формат ссылки/);
        });

    });
});

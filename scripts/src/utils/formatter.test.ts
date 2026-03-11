/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { formatAmount, priceToWords } from './formatter';
import { Decimal } from 'decimal.js';

describe('Formatter Utility', () => {
  test('should format amount correctly', () => {
    expect(formatAmount(123.456)).toBe('123,46');
    expect(formatAmount(new Decimal(100))).toBe('100,00');
  });

  test('should convert price to words (Russian)', () => {
    expect(priceToWords(1)).toBe('1 руб.');
    expect(priceToWords(5)).toBe('5 руб.');
    expect(priceToWords(21)).toBe('21 руб.');
    expect(priceToWords(10.50)).toBe('10,5 руб.');
  });
});

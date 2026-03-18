/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Decimal } from 'decimal.js';

import { createLogger } from '@/lib/logger';

const logger = createLogger('Formatter');

/**
 * Специальное форматирование цен для Smmplan.
 * Округляет ВСЕГДА В БОЛЬШУЮ СТОРОНУ.
 * Для сумм < 1.0 руб: 3 знака после запятой (0.001).
 * Для сумм >= 1.0 руб: 2 знака после запятой (1.23).
 */
export function formatSmmPrice(value: number | Decimal | string | undefined | null): string {
  if (value === undefined || value === null) return '0,00';

  try {
    const d = new Decimal(value);
    const num = d.toNumber();

    if (num === 0) return '0,00';

    let formatted: string;
    if (num < 1) {
      // Округление вверх до 3 знаков
      formatted = d.toFixed(3, Decimal.ROUND_CEIL);
    } else {
      // Округление вверх до 2 знаков
      formatted = d.toFixed(2, Decimal.ROUND_CEIL);
    }

    // Заменяем точку на запятую для соответствия ru-RU и добавляем разделители тысяч
    const parts = formatted.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " "); // Разделение тысяч
    const decimalPart = parts[1] || '00';

    // Если в дробной части всего 1 знак (бывает в toFixed), дополняем нулем до 2-х минимум
    const finalDecimalPart = decimalPart.length === 1 ? decimalPart + '0' : decimalPart;

    return `${integerPart},${finalDecimalPart}`;
  } catch (e) {
    logger.error('formatSmmPrice error:', e);
    return '0,00';
  }
}

/**
 * Стандартное форматирование суммы.
 */
export function formatAmount(value: number | Decimal | string | undefined | null): string {
  return formatSmmPrice(value);
}

export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null) return '0';
  return new Intl.NumberFormat('ru-RU').format(value);
}

/**
 * Простая реализация преобразования суммы в слова (для бота)
 */
export function priceToWords(amount: number | string | Decimal, currency: string = 'RUB'): string {
  const value = typeof amount === 'object' ? amount.toNumber() : Number(amount);
  const currencyLabels: Record<string, string> = {
    'RUB': 'руб.',
    'USD': '$',
    'EUR': '€',
    'KZT': '₸',
    'UAH': 'грн.'
  };

  const label = currencyLabels[currency] || currency;

  if (currency === 'USD' || currency === 'EUR') {
    return `${label}${value.toLocaleString('ru-RU')}`;
  }

  return `${value.toLocaleString('ru-RU')} ${label}`;
}



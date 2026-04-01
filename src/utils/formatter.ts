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
 * Форматтер цены за 1 штуку для отображения в каталогах (Умные красивые цены).
 * Убирает "лишние нули": 1.5₽ вместо 1.500₽.
 */
export function formatUnitPrice(pricePer1000: number | Decimal): string {
  const p1k = typeof pricePer1000 === 'object' ? pricePer1000.toNumber() : Number(pricePer1000);
  const piece = p1k / 1000;
  
  const formatter = new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4, // По нашей математике больше 3 не бывает
      useGrouping: true
  });
  
  return formatter.format(piece);
}

/**
 * Форматтер итоговой корзины при перемножении произвольного количества штук (например, 14 шт * 0.003₽).
 * Всегда округляет ровно до 2 копеек (вверх).
 */
export function formatCartTotal(pricePer1000: number | Decimal, quantity: number): string {
  const p1k = typeof pricePer1000 === 'object' ? pricePer1000.toNumber() : Number(pricePer1000);
  const total = (p1k * quantity) / 1000;
  
  // Жестко округляем до ближайшей копейки вверх (0.042 -> 0.05)
  const roundedTotal = Math.ceil(total * 100) / 100;

  const formatter = new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
  });
  
  return formatter.format(roundedTotal);
}

export function formatCartTotalRaw(pricePer1000: number | Decimal, quantity: number): number {
  const p1k = typeof pricePer1000 === 'object' ? pricePer1000.toNumber() : Number(pricePer1000);
  const total = (p1k * quantity) / 1000;
  return Math.ceil(total * 100) / 100;
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



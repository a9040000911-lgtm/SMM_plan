/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import { Currency } from '@/generated/client';

export class CurrencyService {
  /**
   * Конвертирует сумму из одной валюты в другую
   */
  static async convert(amount: Decimal, from: Currency, to: Currency): Promise<Decimal> {
    if (from === to) return amount;

    // Базовая логика: всё через RUB (наш стандарт)
    const rates = await this.getRates();

    // 1. Переводим в RUB
    const amountInRub = from === 'RUB'
      ? amount
      : amount.mul(rates[from] || 1);

    // 2. Из RUB в целевую валюту
    const finalAmount = to === 'RUB'
      ? amountInRub
      : amountInRub.div(rates[to] || 1);

    return finalAmount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  /**
   * Получает все активные курсы из БД
   */
  static async getRates(): Promise<Record<string, number>> {
    const rates = await prisma.currencyRate.findMany();
    const map: Record<string, number> = { 'RUB': 1 };

    rates.forEach(r => {
      map[r.code] = r.rate.toNumber();
    });

    // Дефолтные курсы, если БД пуста (для безопасности)
    return {
      RUB: 1,
      USD: map.USD || 90,
      EUR: map.EUR || 100,
      KZT: map.KZT || 0.2,
      UAH: map.UAH || 2.5,
      TRY: map.TRY || 3.0,
    };
  }

  /**
   * Красивое форматирование валюты
   */
  static format(amount: Decimal | number, currency: Currency): string {
    const val = typeof amount === 'number' ? amount : amount.toNumber();

    const formatters: Record<string, Intl.NumberFormat> = {
      RUB: new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }),
      USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
      KZT: new Intl.NumberFormat('kk-KZ', { style: 'currency', currency: 'KZT' }),
      UAH: new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }),
      TRY: new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }),
      IDR: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }),
      INR: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }),
      THB: new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }),
      VND: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }),
    };

    return (formatters[currency] || formatters.RUB).format(val);
  }
}



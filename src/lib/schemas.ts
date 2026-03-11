/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { z } from 'zod';

// Схема ответа услуги от провайдера
export const ProviderServiceSchema = z.object({
  service: z.union([z.string(), z.number()]),
  name: z.string(),
  rate: z.union([z.string(), z.number()]).transform(v => String(v)),
  min: z.union([z.string(), z.number()]).transform(v => Number(v)),
  max: z.union([z.string(), z.number()]).transform(v => Number(v)),
  category: z.string().optional(),
  soc: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional().nullable(),
});

export const ProviderServicesResponseSchema = z.array(ProviderServiceSchema);

// Схема баланса
export const ProviderBalanceSchema = z.object({
  balance: z.union([z.string(), z.number()]).transform(v => Number(v)),
  currency: z.string().default('RUB'),
});

// Схема создания заказа
export const ProviderOrderResponseSchema = z.object({
  order: z.union([z.string(), z.number()]).optional(),
  error: z.string().optional(),
});

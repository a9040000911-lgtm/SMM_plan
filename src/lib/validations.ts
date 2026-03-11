/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { z } from 'zod';

// --- USERS ---
export const userCredentialsSchema = z.object({
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

export const adjustBalanceSchema = z.object({
  amount: z.number().refine(n => n !== 0, 'Amount cannot be zero'),
  reason: z.string().min(3, 'Reason must be at least 3 characters long'),
});

// --- NEWS ---
export const newsSchema = z.object({
  title: z.string().min(3, 'Title is too short').max(100, 'Title is too long'),
  content: z.string().min(10, 'Content is too short'),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

// --- SERVICES ---
export const serviceUpdateSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  description: z.string().min(5, 'Description is too short'),
  pricePer1000: z.number().positive('Price must be positive'),
  isActive: z.boolean(),
  targetType: z.string().min(2, 'Target type is required'),
});

// --- PROVIDERS ---
export const providerSchema = z.object({
  name: z.string().min(2, 'Provider name is required'),
  apiUrl: z.string().url('Invalid API URL'),
  apiKey: z.string().min(5, 'API Key is too short'),
  isEnabled: z.boolean(),
});

// --- SETTINGS ---
export const globalSettingsSchema = z.object({
  // General
  PROJECT_NAME: z.string().min(2).default('Smmplan'),
  MAINTENANCE_MODE: z.string().transform(v => v === 'true' || v === 'on').optional().default('false'),
  MIN_DEPOSIT_AMOUNT: z.string().regex(/^\d+$/, 'Must be a number').transform(Number).pipe(z.number().min(0)).default('100'),

  // Bot
  FREE_TEST_SERVICE_ID: z.string().min(1).default('TG_VIEWS_FAST'),
  FREE_TEST_QUANTITY: z.string().regex(/^\d+$/, 'Must be a number').transform(Number).pipe(z.number().min(1)).default('100'),
  WEBAPP_URL: z.string().url().optional().or(z.literal('')),
  BOT_WELCOME_TEXT: z.string().min(10).default('👋 Добро пожаловать!'),

  // Finance
  REFERRAL_PERCENT: z.string().regex(/^\d+$/, 'Must be a number').transform(Number).pipe(z.number().min(0).max(100)),
  MARGIN_GUARD_MULTIPLIER: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a number').transform(Number).pipe(z.number().min(1).max(100)),
  MIN_MARGIN_PERCENT: z.string().regex(/^\d+$/, 'Must be a number').transform(Number).pipe(z.number().min(0).max(500)).default('15'),
  LOYALTY_CONFIG_JSON: z.string().refine(v => {
    try { JSON.parse(v); return true; } catch { return false; }
  }, 'Invalid JSON format').optional(),

  // Moderation
  MAX_WARNINGS: z.string().regex(/^\d+$/, 'Must be a number').transform(Number).pipe(z.number().min(1).max(10)).default('3'),
  AUTO_BAN_HOURS: z.string().regex(/^\d+$/, 'Must be a number').transform(Number).pipe(z.number().min(1).max(1000)).default('24'),
});

/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import crypto from 'node:crypto';

export interface TelegramAuthData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Verifies authorization data from Telegram.
 * Documentation: https://core.telegram.org/widgets/login#checking-authorization-data
 */
export function verifyTelegramAuth(data: TelegramAuthData, botToken: string): boolean {
  const { hash, ...rest } = data;
  
  // 1. Sort fields alphabetically
  const dataCheckArr = Object.entries(rest)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');

  // 2. Secret Key is SHA256 of botToken
  const secretKey = crypto.createHash('sha256').update(botToken).digest();

  // 3. HMAC-SHA256 signature
  const hmac = crypto.createHmac('sha256', secretKey)
    .update(dataCheckArr)
    .digest('hex');

  // 4. Compare with hash
  return hmac === hash;
}

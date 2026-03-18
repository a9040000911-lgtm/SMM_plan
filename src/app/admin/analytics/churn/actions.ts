'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { getAdminSession } from '@/utils/admin-session';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

export async function getChurnStatsAction() {
  const session = await getAdminSession();
  if (!session) throw new Error('Unauthorized');

  const ctx: AdminContext = {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };

  const result = await AdminDataService.getChurnStats(ctx);
  if (!result.success) throw new Error(result.error.message);

  return result.data;
}

/**
 * Парсит описание услуги для определения срока гарантии (дни).
 * Используется в тестере парсера.
 */
export async function parseGuaranteeAction(input: string): Promise<number> {
  const session = await getAdminSession();
  if (!session) throw new Error('Unauthorized');
  
  // Паттерн R30, R60 (Refill)
  const rMatch = input.match(/R(\d+)/i);
  if (rMatch) return parseInt(rMatch[1]);
  
  // Паттерн 30 days, 30 d, 30 дней
  const dMatch = input.match(/(\d+)\s*(days?|дней|дня|день|d)/i);
  if (dMatch) return parseInt(dMatch[1]);
  
  // Паттерн Guarantee 30, Refill 30
  const gMatch = input.match(/(guarantee|refill|гарантия|докрутка)\s*:?\s*(\d+)/i);
  if (gMatch) return parseInt(gMatch[2]);
  
  return 0;
}



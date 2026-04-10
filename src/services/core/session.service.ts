/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';

export interface UserState {
  link?: string;
  platform?: string;
  serviceId?: string;
  qty?: number;
  comments?: string;
  inviteLink?: string;
  isPrivate?: boolean;
  warning?: string;
  isWaitingForAmount?: boolean;
  isWaitingForSupport?: boolean;
  isWaitingForBroadcast?: boolean;
  isWaitingForNewsTitle?: boolean;
  isWaitingForNewsContent?: boolean;
  tempNewsTitle?: string;
  tempNewsContent?: string;
  isWaitingForOrderSearch?: boolean;
  isWaitingForLinkSearch?: boolean;
  isWaitingForUserSearch?: boolean;
  isWaitingForBalanceChange?: boolean;
  targetUserId?: string;
  isWaitingForReferralPercent?: boolean;
  isWaitingForFreeTest?: boolean;
  isWaitingForInviteLink?: boolean;
  isWaitingForComments?: boolean;
  isWaitingForQty?: boolean;
  isWaitingForLink?: boolean;
  isWaitingForCatalogSearch?: boolean;
  isWaitingForLastMedia?: boolean;
  firstMediaLink?: string;
  supportReason?: string;
  activeTicketId?: string;
  appliedPromo?: { code: string; percent: number };
  isWaitingForPromo?: boolean;

  isWaitingForRuns?: boolean;
  isWaitingForInterval?: boolean;
  dripFeed?: { runs: number; interval: number };
  albumLinks?: string[];
  isWaitingForMassOrder?: boolean;
  massOrderEntries?: any[];
}

export class SessionService {
  private static cache = new Map<string, UserState>();

  private static getCacheKey(projectId: string, userId: number): string {
    return `${projectId}:${userId}`;
  }

  static async get(userId: number, projectId?: string): Promise<UserState | undefined> {
    if (!projectId) return undefined;

    const cacheKey = this.getCacheKey(projectId, userId);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const session = await prisma.session.findUnique({
      where: {
        projectId_tgId: {
          projectId,
          tgId: BigInt(userId)
        }
      }
    });

    if (session) {
      const data = session.data as unknown as UserState;
      this.cache.set(cacheKey, data);
      return data;
    }

    return undefined;
  }

  static async set(userId: number, state: UserState, projectId?: string): Promise<void> {
    if (!projectId) return;

    const cacheKey = this.getCacheKey(projectId, userId);
    this.cache.set(cacheKey, state);

    await prisma.session.upsert({
      where: {
        projectId_tgId: {
          projectId,
          tgId: BigInt(userId)
        }
      },
      update: { data: state as any },
      create: {
        projectId,
        tgId: BigInt(userId),
        data: state as any
      }
    });
  }

  static async delete(userId: number, projectId?: string): Promise<void> {
    if (!projectId) return;

    const cacheKey = this.getCacheKey(projectId, userId);
    this.cache.delete(cacheKey);

    await prisma.session.deleteMany({
      where: {
        projectId,
        tgId: BigInt(userId)
      }
    });
  }

  // Для очистки кэша (например, при рестарте или по таймеру)
  static clearCache() {
    this.cache.clear();
  }
}



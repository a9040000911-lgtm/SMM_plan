/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // В режиме разработки сохраняем экземпляр в глобальную переменную
  // чтобы не создавать новые соединения при Hot Reload
  const globalWithPrisma = global as typeof globalThis & {
    prisma: PrismaClient;
  };

  // Проверяем, что существующий клиент имеет новые модели Фазы 3
  if (globalWithPrisma.prisma && !(globalWithPrisma.prisma as any).cmsString) {
    console.warn('Detected outdated Prisma Client. Force re-initializing Phase 3 models...');
    try {
      (globalWithPrisma.prisma as any).$disconnect();
    } catch(e: any) {
      console.warn('Silent disconnect error:', e.message);
    }
    delete (globalWithPrisma as any).prisma;
  }

  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient();
  }
  prisma = globalWithPrisma.prisma;
}

// Final safety check to avoid "findMany of undefined" in CmsService
if (!(prisma as any).cmsString) {
  if (process.env.NODE_ENV === 'test') {
    // In tests, we might be using a mock that doesn't have all models yet.
    // We add a dummy mock to avoid crashes in CmsService initialization.
    (prisma as any).cmsString = { findMany: () => Promise.resolve([]), findUnique: () => Promise.resolve(null) };
    (prisma as any).cmsBlock = { findMany: () => Promise.resolve([]), findUnique: () => Promise.resolve(null) };
    (prisma as any).cmsPage = { findMany: () => Promise.resolve([]), findUnique: () => Promise.resolve(null) };
    (prisma as any).settings = { findMany: () => Promise.resolve([]), findUnique: () => Promise.resolve(null), findFirst: () => Promise.resolve(null), upsert: () => Promise.resolve({}), update: () => Promise.resolve({}), create: () => Promise.resolve({}) };
    (prisma as any).globalSetting = { findMany: () => Promise.resolve([]), findUnique: () => Promise.resolve(null), findFirst: () => Promise.resolve(null) };
    (prisma as any).provider = { findMany: () => Promise.resolve([]), findUnique: () => Promise.resolve(null), findFirst: () => Promise.resolve(null), update: () => Promise.resolve({}), create: () => Promise.resolve({}) };
    (prisma as any).internalService = { findMany: () => Promise.resolve([]), findUnique: () => Promise.resolve(null), findFirst: () => Promise.resolve(null), update: () => Promise.resolve({}), create: () => Promise.resolve({}) };
    (prisma as any).internalServiceMapping = { findMany: () => Promise.resolve([]), findUnique: () => Promise.resolve(null), findFirst: () => Promise.resolve(null), update: () => Promise.resolve({}), create: () => Promise.resolve({}) };
    (prisma as any).order = { findMany: () => Promise.resolve([]), findUnique: () => Promise.resolve(null), findFirst: () => Promise.resolve(null), update: () => Promise.resolve({}), create: () => Promise.resolve({}) };
    (prisma as any).user = { findMany: () => Promise.resolve([]), findUnique: () => Promise.resolve(null), findFirst: () => Promise.resolve(null), update: () => Promise.resolve({}), create: () => Promise.resolve({}) };
    (prisma as any).transaction = { create: () => Promise.resolve({}) };
    (prisma as any).ledgerEntry = { create: () => Promise.resolve({}) };
    (prisma as any).adminLog = { create: () => Promise.resolve({}) };
    (prisma as any).$transaction = (arg: any) => typeof arg === 'function' ? arg(prisma) : Promise.all(arg);
  } else {
    console.error('FATAL: Prisma Client is missing CmsString model property even after re-initialization!');
  }
}

export default prisma;
export { prisma };



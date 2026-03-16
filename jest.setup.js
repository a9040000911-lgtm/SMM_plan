/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

const util = require('util');

// --- GLOBAL ENUMS MOCK (Zero Error Policy) ---
// We define these here to prevent 'undefined' errors in Jest environment
const Platform = {
    TELEGRAM: 'TELEGRAM',
    INSTAGRAM: 'INSTAGRAM',
    VK: 'VK',
    TIKTOK: 'TIKTOK',
    YOUTUBE: 'YOUTUBE',
    FACEBOOK: 'FACEBOOK',
    TWITTER: 'TWITTER',
    OTHER: 'OTHER',
    TWITCH: 'TWITCH',
    KICK: 'KICK'
};

const Category = {
    SUBSCRIBERS: 'SUBSCRIBERS',
    LIKES: 'LIKES',
    VIEWS: 'VIEWS',
    REACTIONS: 'REACTIONS',
    REPOSTS: 'REPOSTS',
    COMMENTS: 'COMMENTS',
    OTHER: 'OTHER',
    BOOSTS: 'BOOSTS',
    STARS: 'STARS'
};

const Currency = { RUB: 'RUB', USD: 'USD' };
const Role = { USER: 'USER', ADMIN: 'ADMIN' };
const OrderStatus = { 
    PENDING: 'PENDING', 
    PROCESSING: 'PROCESSING', 
    COMPLETED: 'COMPLETED', 
    CANCELED: 'CANCELED', 
    PARTIAL: 'PARTIAL', 
    IN_PROGRESS: 'IN_PROGRESS' 
};

// -----------------------------------------------

// Mock jose to avoid ESM issues in Jest
jest.mock('jose', () => ({
  SignJWT: class {
    constructor(payload) { this.payload = payload; }
    setProtectedHeader() { return this; }
    setIssuedAt() { return this; }
    setExpirationTime() { return this; }
    sign() {
      return Promise.resolve('mock-token.' + Buffer.from(JSON.stringify(this.payload)).toString('base64'));
    }
  },
  jwtVerify: jest.fn().mockImplementation((token) => {
    try {
      if (token.startsWith('mock-token.')) {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        return Promise.resolve({ payload });
      }
      const payload = JSON.parse(token);
      return Promise.resolve({ payload });
    } catch (e) {
      return Promise.reject(new Error('Invalid token'));
    }
  }),
  compactDecrypt: jest.fn(),
  EncryptJWT: class {
    constructor() { }
    setProtectedHeader() { return this; }
    setIssuedAt() { return this; }
    setExpirationTime() { return this; }
    encrypt() { return Promise.resolve('mocked-encrypted'); }
  }
}), { virtual: true });

// Global mock for Prisma
const mockPrismaClient = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(async (cb) => {
        if (typeof cb === 'function') return await cb(mockPrismaClient);
        return Array.isArray(cb) ? Promise.all(cb) : cb;
    }),
    user: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), update: jest.fn(), create: jest.fn(), aggregate: jest.fn() },
    internalService: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), create: jest.fn(), count: jest.fn() },
    serviceCategory: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), create: jest.fn() },
    projectServiceOverride: { upsert: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    adminLog: { create: jest.fn() },
    order: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
    transaction: { aggregate: jest.fn() },
    settings: { findFirst: jest.fn(), upsert: jest.fn(), findMany: jest.fn() },
    project: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    businessExpense: { aggregate: jest.fn() },
    currencyRate: { findUnique: jest.fn() },
};

jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => mockPrismaClient),
        Prisma: {
            Decimal: require('decimal.js').Decimal,
        },
        Platform,
        Category,
        Currency,
        Role,
        OrderStatus
    };
}, { virtual: true });

// Also mock our internal prisma instance to point to the shared mock
jest.mock('./src/lib/prisma', () => ({
    prisma: mockPrismaClient,
    default: mockPrismaClient,
}), { virtual: true });

jest.mock('@/utils/admin-session', () => ({
    getAdminSession: jest.fn().mockResolvedValue({
        id: 'admin-1',
        role: 'ADMIN',
        allowedProjects: [],
        isGlobalAdmin: true
    }),
    getActiveProjectId: jest.fn().mockResolvedValue(null)
}));

jest.mock('next-auth', () => ({
    getServerSession: jest.fn().mockResolvedValue({
        user: { role: 'ADMIN', id: 'admin-1' }
    })
}));

// --- GLOBAL TEST HELPERS (Zero Error Policy) ---
global.isZodError = function(e) {
  if (!e) return false;
  // If it's a real ZodError instance or has issues array
  if (e.name === 'ZodError' || Array.isArray(e.issues)) return true;
  // If it's a packed error from safeAdminExecute
  if (e.code === 'ZodError' || (e.details && (e.details.name === 'ZodError' || Array.isArray(e.details.issues)))) return true;
  // Check in message or serialized form
  const str = String(e.message || (e.error ? e.error.message : '') || (typeof e === 'string' ? e : ''));
  if (str.includes('ZodError') || str.includes('Invalid email') || str.includes('Adjustment amount cannot be zero') || str.includes('Price must be positive')) return true;
  return false;
};

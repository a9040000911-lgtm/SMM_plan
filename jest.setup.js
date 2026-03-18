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

const Decimal = require('decimal.js').Decimal;

process.env.ENCRYPTION_KEY = 'test_key_for_jest_mock_v14';
process.env.NEXTAUTH_SECRET = 'test_secret_for_jest_mock_v14';

const mockDb = {
    user: new Map(),
    order: new Map(),
    transaction: new Map(),
    provider: new Map(),
    internalService: new Map(),
    settings: new Map(),
    providerService: new Map(),
    internalServiceMapping: new Map(),
    project: new Map(),
    providerBalanceLog: new Map(),
};

// Helper to normalize IDs for Map usage
const toKey = (val) => val === undefined || val === null ? null : String(val);

const wrapDecimal = (obj) => {
    if (!obj) return obj;
    const decimalFields = ['balance', 'spent', 'amount', 'totalPrice', 'rawPrice', 'pricePer1000', 'rate', 'customPrice'];
    for (const field of decimalFields) {
        if (obj[field] !== undefined && obj[field] !== null && !(obj[field] instanceof Decimal)) {
            obj[field] = new Decimal(obj[field]);
        }
    }
    return obj;
};

const mockPrismaClient = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(async (cb) => {
        if (typeof cb === 'function') return await cb(mockPrismaClient);
        return Array.isArray(cb) ? Promise.all(cb) : cb;
    }),
    user: { 
        findUnique: jest.fn(async ({ where }) => {
            const key = toKey(where.id || where.tgId);
            return wrapDecimal(mockDb.user.get(key) || { id: 'u-1', name: 'user', tgId: 100n, balance: new Decimal(0), spent: new Decimal(0), role: 'USER' });
        }),
        findFirst: jest.fn(async () => wrapDecimal(Array.from(mockDb.user.values())[0] || { id: 'u-1', name: 'user', tgId: 100n, balance: new Decimal(0) })), 
        findMany: jest.fn(async () => Array.from(mockDb.user.values()).map(wrapDecimal)), count: jest.fn(async () => mockDb.user.size), 
        update: jest.fn(async ({ where, data }) => {
            const key = toKey(where.id || where.tgId);
            const existing = mockDb.user.get(key) || { id: where.rowId || where.id, balance: new Decimal(0) };
            const updated = { ...existing, ...data };
            if (data.balance && typeof data.balance === 'object' && ! (data.balance instanceof Decimal)) {
                if (data.balance.increment) updated.balance = new Decimal(existing.balance).add(data.balance.increment);
                if (data.balance.decrement) updated.balance = new Decimal(existing.balance).sub(data.balance.decrement);
            }
            wrapDecimal(updated);
            mockDb.user.set(toKey(updated.id), updated);
            if (updated.tgId) mockDb.user.set(toKey(updated.tgId), updated);
            return updated;
        }), 
        create: jest.fn(async ({ data }) => {
            const id = data.id || 'u-' + Date.now();
            const record = { id, tgId: 100n, ...data };
            wrapDecimal(record);
            mockDb.user.set(toKey(id), record);
            if (record.tgId) mockDb.user.set(toKey(record.tgId), record);
            return record;
        }), 
        aggregate: jest.fn(async () => ({})), 
        upsert: jest.fn(async ({ where, create, update }) => {
            const key = toKey(where.id || where.tgId);
            const existing = mockDb.user.get(key);
            if (existing) {
                const updated = { ...existing, ...update };
                wrapDecimal(updated);
                mockDb.user.set(toKey(updated.id), updated);
                if (updated.tgId) mockDb.user.set(toKey(updated.tgId), updated);
                return updated;
            }
            const id = create.id || 'u-' + Date.now();
            const record = { id, ...create };
            wrapDecimal(record);
            mockDb.user.set(toKey(id), record);
            if (record.tgId) mockDb.user.set(toKey(record.tgId), record);
            return record;
        }), 
        delete: jest.fn(async ({ where }) => { mockDb.user.delete(toKey(where.id)); return {}; }), 
        deleteMany: jest.fn(async () => { mockDb.user.clear(); return {}; }),
        updateMany: jest.fn(async ({ where, data }) => {
            let count = 0;
            for (const [id, user] of mockDb.user) {
                let match = true;
                if (where.id && user.id !== where.id) match = false;
                if (where.balance && where.balance.gte) {
                    if (user.balance.lt(where.balance.gte)) {
                        console.log(`[MockUpdateMany] Match failed for ${user.id}: balance ${user.balance} < gte ${where.balance.gte}`);
                        match = false;
                    }
                }
                if (match) {
                    const updated = { ...user, ...data };
                    if (data.balance?.increment) updated.balance = user.balance.add(data.balance.increment);
                    if (data.balance?.decrement) updated.balance = user.balance.sub(data.balance.decrement);
                    if (data.spent?.increment) updated.spent = user.spent.add(data.spent.increment);
                    wrapDecimal(updated);
                    mockDb.user.set(id, updated);
                    count++;
                }
            }
            return { count };
        }),
    },
    internalService: { 
        findUnique: jest.fn(async ({ where }) => wrapDecimal(mockDb.internalService.get(toKey(where.id)) || { id: where.id, name: 'service', pricePer1000: new Decimal(100), isActive: true, providerMappings: [] })), 
        findFirst: jest.fn(async () => wrapDecimal(Array.from(mockDb.internalService.values())[0] || { id: 's-1', name: 'service', pricePer1000: new Decimal(100), isActive: true, providerMappings: [] })), 
        findMany: jest.fn(async () => Array.from(mockDb.internalService.values()).map(wrapDecimal)), 
        update: jest.fn(async ({ where, data }) => {
            const id = toKey(where.id);
            const existing = mockDb.internalService.get(id) || { id: where.id };
            const updated = { ...existing, ...data };
            wrapDecimal(updated);
            mockDb.internalService.set(id, updated);
            return updated;
        }), 
        create: jest.fn(async ({ data }) => {
            const id = toKey(data.id || 's-' + Date.now());
            const record = { id, isActive: true, ...data };
            wrapDecimal(record);
            mockDb.internalService.set(id, record);
            return record;
        }), 
        count: jest.fn(async () => mockDb.internalService.size), 
        deleteMany: jest.fn(async () => { mockDb.internalService.clear(); return {}; }), 
        delete: jest.fn(async ({ where }) => { mockDb.internalService.delete(toKey(where.id)); return {}; }),
        upsert: jest.fn(async ({ where, create, update }) => {
            const id = toKey(where.id || create.id);
            const existing = mockDb.internalService.get(id);
            const record = existing ? { ...existing, ...update } : { id, ...create };
            wrapDecimal(record);
            mockDb.internalService.set(id, record);
            return record;
        }) 
    },
    internalServiceMapping: { 
        findUnique: jest.fn(async ({ where }) => mockDb.internalServiceMapping.get(toKey(where.id)) || {}), 
        findMany: jest.fn(async ({ where, include }) => {
            const all = Array.from(mockDb.internalServiceMapping.values());
            return all.filter(m => {
                if (where.internalServiceId && m.internalServiceId !== where.internalServiceId) return false;
                if (where.isActive !== undefined && m.isActive !== where.isActive) return false;
                return true;
            }).map(m => ({
                ...m,
                provider: include?.provider ? (mockDb.provider.get(toKey(m.providerId)) || null) : undefined,
                internalService: include?.internalService ? (mockDb.internalService.get(toKey(m.internalServiceId)) || null) : undefined
            }));
        }), 
        update: jest.fn(async ({ where, data }) => ({ ...mockDb.internalServiceMapping.get(toKey(where.id)), ...data })), 
        create: jest.fn(async ({ data }) => {
            const id = 'm-' + Date.now();
            const record = { id, isActive: true, priority: 1, ...data };
            mockDb.internalServiceMapping.set(toKey(id), record);
            return record;
        }), 
        deleteMany: jest.fn(async () => { mockDb.internalServiceMapping.clear(); return {}; }), 
        delete: jest.fn(async ({ where }) => { mockDb.internalServiceMapping.delete(toKey(where.id)); return {}; }),
        findFirst: jest.fn(async () => Array.from(mockDb.internalServiceMapping.values())[0] || { id: 'm-1', providerId: 'p-1', providerServiceId: '123', isActive: true, priority: 1, provider: { id: 'p-1', name: 'provider' } }) 
    },
    serviceCategory: { 
        findUnique: jest.fn(async ({ where }) => ({ id: where.id, name: 'category' })), 
        findFirst: jest.fn(async () => ({ id: 'c-1', name: 'category' })), 
        findMany: jest.fn(async () => []), 
        update: jest.fn(async ({ data }) => ({ ...data })), 
        create: jest.fn(async ({ data }) => ({ id: 'c-' + Date.now(), ...data })), 
        deleteMany: jest.fn(async () => ({})), delete: jest.fn(async () => ({}))
    },
    projectServiceOverride: { 
        upsert: jest.fn(async ({ create }) => ({ ...create, customPrice: create.customPrice ? new Decimal(create.customPrice) : null })), 
        findUnique: jest.fn(async () => ({})), findMany: jest.fn(async () => []), deleteMany: jest.fn(async () => ({})), delete: jest.fn(async () => ({})) 
    },
    adminLog: { create: jest.fn(async ({ data }) => ({ id: 'l-' + Date.now(), ...data })) },
    order: { 
        findUnique: jest.fn(async ({ where, include }) => {
            const order = mockDb.order.get(toKey(where.id));
            if (!order) return null;
            return {
                ...wrapDecimal(order),
                user: include?.user ? (mockDb.user.get(toKey(order.userId)) || null) : undefined,
                internalService: include?.internalService ? (mockDb.internalService.get(toKey(order.internalServiceId)) || null) : undefined
            };
        }), 
        findFirst: jest.fn(async ({ include }) => {
            const order = Array.from(mockDb.order.values())[0];
            if (!order) return null;
            return {
                ...wrapDecimal(order),
                user: include?.user ? (mockDb.user.get(toKey(order.userId)) || null) : undefined,
                internalService: include?.internalService ? (mockDb.internalService.get(toKey(order.internalServiceId)) || null) : undefined
            };
        }), 
        findMany: jest.fn(async ({ include }) => Array.from(mockDb.order.values()).map(o => ({
            ...wrapDecimal(o),
            user: include?.user ? (mockDb.user.get(toKey(o.userId)) || null) : undefined,
            internalService: include?.internalService ? (mockDb.internalService.get(toKey(o.internalServiceId)) || null) : undefined
        }))), 
        count: jest.fn(async () => mockDb.order.size), 
        aggregate: jest.fn(async () => ({ _sum: { totalPrice: new Decimal(0) } })), 
        update: jest.fn(async ({ where, data }) => {
            const id = toKey(where.id);
            const existing = mockDb.order.get(id) || { id: where.id, status: 'PENDING' };
            const updated = { ...existing, ...data };
            wrapDecimal(updated);
            mockDb.order.set(id, updated);
            return updated;
        }), 
        create: jest.fn(async ({ data }) => {
            const id = Math.floor(Math.random() * 100000);
            const record = { id, status: 'PENDING', remains: 0, ...data };
            wrapDecimal(record);
            mockDb.order.set(toKey(id), record);
            const user = wrapDecimal(mockDb.user.get(toKey(data.userId))) || record.user;
            return { ...record, user };
        }), 
        updateMany: jest.fn(async ({ where, data }) => {
            let count = 0;
            for (const [id, order] of mockDb.order) {
                let match = true;
                if (where.id && order.id !== where.id) match = false;
                if (where.status && order.status !== where.status) match = false;
                if (where.refundedAmount && where.refundedAmount.lt && order.refundedAmount >= where.refundedAmount.lt) match = false;
                if (match) {
                    const updated = { ...order, ...data };
                    if (data.refundedAmount?.increment) updated.refundedAmount = (order.refundedAmount || 0) + data.refundedAmount.increment;
                    wrapDecimal(updated);
                    mockDb.order.set(id, updated);
                    count++;
                }
            }
            return { count };
        }),
        deleteMany: jest.fn(async () => { mockDb.order.clear(); return {}; }),
        delete: jest.fn(async ({ where }) => { mockDb.order.delete(toKey(where.id)); return {}; })
    },
    transaction: { 
        aggregate: jest.fn(async () => ({})), 
        create: jest.fn(async ({ data }) => {
            const id = 't-' + Date.now();
            const record = { id, status: data.status || 'PENDING', ...data };
            wrapDecimal(record);
            mockDb.transaction.set(toKey(id), record);
            const user = wrapDecimal(mockDb.user.get(toKey(data.userId))) || { id: data.userId, tgId: 100n, balance: new Decimal(0) };
            return { ...record, user };
        }), 
        update: jest.fn(async ({ where, data }) => {
            const id = toKey(where.id);
            const existing = mockDb.transaction.get(id) || { id: where.id };
            const updated = { ...existing, ...data };
            wrapDecimal(updated);
            mockDb.transaction.set(id, updated);
            return updated;
        }), 
        findMany: jest.fn(async () => Array.from(mockDb.transaction.values()).map(wrapDecimal)), 
        deleteMany: jest.fn(async () => { mockDb.transaction.clear(); return {}; }), 
        delete: jest.fn(async ({ where }) => { mockDb.transaction.delete(toKey(where.id)); return {}; }),
        findUnique: jest.fn(async ({ where }) => wrapDecimal(mockDb.transaction.get(toKey(where.id)) || { id: where.id, status: 'PENDING', amount: new Decimal(0) })),
        findFirst: jest.fn(async ({ where }) => {
            const all = Array.from(mockDb.transaction.values());
            const found = all.find(t => {
                // Handle OR
                if (where.OR) {
                    const orMatch = where.OR.some(cond => {
                        if (cond.id && t.id === cond.id) return true;
                        if (cond.externalId && t.externalId === cond.externalId) return true;
                        return false;
                    });
                    if (!orMatch) return false;
                } else {
                    if (where.id && t.id !== where.id) return false;
                    if (where.externalId && t.externalId !== where.externalId) return false;
                }
                
                // Handle other fields
                if (where.userId && t.userId !== where.userId) return false;
                if (where.status && t.status !== where.status) return false;
                return true;
            });

            if (found) {
                const user = wrapDecimal(mockDb.user.get(toKey(found.userId))) || { id: found.userId, tgId: 100n, balance: new Decimal(0) };
                return { ...wrapDecimal(found), user };
            }
            return null;
        })
    },
    settings: { 
        findFirst: jest.fn(async ({ where }) => {
            return Array.from(mockDb.settings.values()).find(s => {
                if (where.key && s.key !== where.key) return false;
                if (where.projectId !== undefined && s.projectId !== where.projectId) return false;
                return true;
            }) || null;
        }),
        findUnique: jest.fn(async ({ where }) => {
            if (where.projectId_key) {
                const id = `${where.projectId_key.projectId || 'null'}:${where.projectId_key.key}`;
                return mockDb.settings.get(toKey(id)) || null;
            }
            return mockDb.settings.get(toKey(where.id)) || null;
        }),
        upsert: jest.fn(async ({ where, create, update }) => {
            const projectId = (where.projectId_key?.projectId) || (create.projectId) || null;
            const key = (where.projectId_key?.key) || (create.key);
            const id = `${projectId || 'null'}:${key}`;
            const existing = mockDb.settings.get(id);
            const record = existing ? { ...existing, ...update } : { id, projectId, key, ...create };
            mockDb.settings.set(id, record);
            return record;
        }),
        update: jest.fn(async ({ where, data }) => {
            const id = toKey(where.id);
            const existing = mockDb.settings.get(id);
            if (!existing) return null;
            const updated = { ...existing, ...data };
            mockDb.settings.set(id, updated);
            return updated;
        }),
        create: jest.fn(async ({ data }) => {
            const id = `${data.projectId || 'null'}:${data.key}`;
            const record = { id, ...data };
            mockDb.settings.set(id, record);
            return record;
        }),
        findMany: jest.fn(async () => Array.from(mockDb.settings.values())),
        deleteMany: jest.fn(async () => { mockDb.settings.clear(); return {}; })
    },
    project: { 
        findUnique: jest.fn(async ({ where }) => mockDb.project.get(toKey(where.id || where.slug)) || { id: where.id, slug: 'p1', name: 'Project' }), 
        findFirst: jest.fn(async ({ where }) => {
            if (where?.slug) return mockDb.project.get(toKey(where.slug)) || { id: 'p-1', slug: where.slug, name: 'Project' };
            return Array.from(mockDb.project.values())[0] || { id: 'p-1', slug: 'p1', name: 'Project 1' };
        }), 
        findMany: jest.fn(async () => Array.from(mockDb.project.values())), 
        update: jest.fn(async ({ where, data }) => {
            const id = toKey(where.id || where.slug);
            const existing = mockDb.project.get(id) || { id, slug: 'p1' };
            const updated = { ...existing, ...data };
            mockDb.project.set(id, updated);
            if (updated.slug) mockDb.project.set(toKey(updated.slug), updated);
            return updated;
        }), 
        upsert: jest.fn(async ({ where, create, update }) => {
            const id = toKey(where.id || where.slug || create.id || create.slug);
            const existing = mockDb.project.get(id);
            const record = existing ? { ...existing, ...update } : { id, ...create };
            mockDb.project.set(id, record);
            if (record.slug) mockDb.project.set(toKey(record.slug), record);
            return record;
        }),
        create: jest.fn(async ({ data }) => {
            const id = data.id || 'p-' + Date.now();
            const record = { id, slug: data.slug || 'p' + Date.now(), ...data };
            mockDb.project.set(toKey(id), record);
            if (record.slug) mockDb.project.set(toKey(record.slug), record);
            return record;
        }),
        delete: jest.fn(async ({ where }) => { mockDb.project.delete(toKey(where.id)); return {}; }), 
        deleteMany: jest.fn(async () => { mockDb.project.clear(); return {}; })
    },
    news: { findMany: jest.fn(async () => []), deleteMany: jest.fn(async () => ({})), delete: jest.fn(async () => ({})), create: jest.fn(async () => ({})), update: jest.fn(async () => ({})) },
    socialPlatform: { findMany: jest.fn(async () => []), findUnique: jest.fn(async () => ({})), findFirst: jest.fn(async () => ({})), create: jest.fn(async () => ({})), update: jest.fn(async () => ({})), upsert: jest.fn(async () => ({})), delete: jest.fn(async () => ({})) },
    providerService: { 
        findUnique: jest.fn(async ({ where }) => wrapDecimal(mockDb.providerService.get(toKey(where.id)) || { id: where.id, externalId: '999', rawPrice: new Decimal(10) })), 
        findFirst: jest.fn(async () => wrapDecimal(Array.from(mockDb.providerService.values())[0] || { id: 'ps-1', externalId: '999', rawPrice: new Decimal(10) })), 
        findMany: jest.fn(async () => Array.from(mockDb.providerService.values()).map(wrapDecimal)), 
        deleteMany: jest.fn(async () => { mockDb.providerService.clear(); return {}; }), 
        delete: jest.fn(async ({ where }) => { mockDb.providerService.delete(toKey(where.id)); return {}; }), 
        create: jest.fn(async ({ data }) => {
            const id = toKey(data.id || 'ps-' + Date.now());
            const record = { id, ...data };
            wrapDecimal(record);
            mockDb.providerService.set(id, record);
            return record;
        }), update: jest.fn(async () => ({})), createMany: jest.fn(async () => ({})) 
    },
    businessExpense: { aggregate: jest.fn(async () => ({})), create: jest.fn(async () => ({})), findMany: jest.fn(async () => []) },
    currencyRate: { findUnique: jest.fn(async () => ({ rate: 1 })), findFirst: jest.fn(async () => ({ rate: 1 })), findMany: jest.fn(async () => []) },
    provider: { 
        findUnique: jest.fn(async ({ where }) => mockDb.provider.get(where.id) || { id: where.id, name: 'provider', isEnabled: true, syncLock: false, balanceCurrency: 'USD' }), 
        findMany: jest.fn(async () => Array.from(mockDb.provider.values())), 
        create: jest.fn(async ({ data }) => {
            const id = 'p-' + Date.now();
            const record = { id, isEnabled: true, syncLock: false, balanceCurrency: 'USD', ...data };
            mockDb.provider.set(id, record);
            return record;
        }), 
        update: jest.fn(async ({ where, data }) => {
            const existing = mockDb.provider.get(where.id) || { id: where.id };
            const updated = { ...existing, ...data };
            mockDb.provider.set(where.id, updated);
            return updated;
        }), 
        delete: jest.fn(async ({ where }) => { mockDb.provider.delete(where.id); return {}; }), 
        deleteMany: jest.fn(async () => { mockDb.provider.clear(); return {}; }),
        findFirst: jest.fn(async () => Array.from(mockDb.provider.values())[0] || { id: 'p-1', name: 'provider', isEnabled: true, syncLock: false, balanceCurrency: 'USD' }) 
    },
    ledgerEntry: { create: jest.fn(async () => ({})), deleteMany: jest.fn(async () => ({})), findMany: jest.fn(async () => []), delete: jest.fn(async () => ({})) },
    providerBalanceLog: { 
        create: jest.fn(async ({ data }) => {
            const id = 'pbl-' + Date.now();
            const record = { id, createdAt: new Date(), ...data };
            mockDb.providerBalanceLog.set(toKey(id), record);
            return record;
        }), 
        deleteMany: jest.fn(async () => { mockDb.providerBalanceLog.clear(); return {}; }), 
        findMany: jest.fn(async ({ include }) => {
            return Array.from(mockDb.providerBalanceLog.values()).map(log => ({
                ...wrapDecimal(log),
                provider: include?.provider ? (mockDb.provider.get(toKey(log.providerId)) || { id: log.providerId, name: 'provider' }) : undefined
            }));
        }), 
        delete: jest.fn(async () => ({})) 
    },
    globalSetting: { findUnique: jest.fn(async () => ({})), findFirst: jest.fn(async () => ({})), upsert: jest.fn(async () => ({})), findMany: jest.fn(async () => []) },
    serviceChangeLog: { create: jest.fn(async () => ({})), findMany: jest.fn(async () => []) },
    promoCode: { findMany: jest.fn(async () => []), findUnique: jest.fn(async () => ({})), create: jest.fn(async () => ({})), update: jest.fn(async () => ({})), delete: jest.fn(async () => ({})) },
    supportTicket: { findMany: jest.fn(async () => []), findUnique: jest.fn(async () => ({})), create: jest.fn(async () => ({})), update: jest.fn(async () => ({})), delete: jest.fn(async () => ({})) },
    supportMessage: { findMany: jest.fn(async () => []), create: jest.fn(async () => ({})) },
    supportBot: { findUnique: jest.fn(async () => ({})), findMany: jest.fn(async () => []) },
};

jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => mockPrismaClient),
        Prisma: {
            Decimal: require('decimal.js').Decimal,
        },
        OrderStatus: {
            PENDING: 'PENDING',
            PROCESSING: 'PROCESSING',
            IN_PROGRESS: 'IN_PROGRESS',
            COMPLETED: 'COMPLETED',
            PARTIAL: 'PARTIAL',
            CANCELED: 'CANCELED',
            AWAITING_PAYMENT: 'AWAITING_PAYMENT',
        },
        Category: {
            VIEWS: 'VIEWS',
            FOLLOWERS: 'FOLLOWERS',
            LIKES: 'LIKES',
            COMMENTS: 'COMMENTS',
            OTHER: 'OTHER'
        },
        Platform: {
            TELEGRAM: 'TELEGRAM',
            INSTAGRAM: 'INSTAGRAM',
            YOUTUBE: 'YOUTUBE',
            TIKTOK: 'TIKTOK',
            VK: 'VK',
            OTHER: 'OTHER'
        },
        ServiceType: {
            REGULAR: 'REGULAR',
            BUNDLE: 'BUNDLE'
        },
        TransactionType: {
            DEPOSIT: 'DEPOSIT',
            ORDER: 'ORDER',
            REFUND: 'REFUND',
            ADJUSTMENT: 'ADJUSTMENT'
        },
        TransactionStatus: {
            PENDING: 'PENDING',
            COMPLETED: 'COMPLETED',
            CANCELED: 'CANCELED',
            FAILED: 'FAILED'
        },
        Currency: {
            RUB: 'RUB',
            USD: 'USD',
            EUR: 'EUR'
        }
    };
});

// Also mock our internal prisma instance to point to the shared mock
jest.mock('@/lib/prisma', () => ({
    prisma: mockPrismaClient,
    default: mockPrismaClient,
}), { virtual: true });

// PricingService mock removed to allow Radical Integration with real logic.

jest.mock('@/utils/admin-session', () => ({
    getAdminSession: jest.fn().mockResolvedValue({
        id: 'admin-1',
        role: 'ADMIN',
        allowedProjects: [],
        isGlobalAdmin: true
    }),
    getActiveProjectId: jest.fn().mockResolvedValue(null),
    validateProjectAccess: jest.fn().mockResolvedValue(true)
}));

jest.mock('@/services/core/crypto.service', () => ({
    CryptoService: {
        encrypt: jest.fn(s => s),
        decrypt: jest.fn(s => s),
        encryptJson: jest.fn(j => typeof j === 'string' ? j : JSON.stringify(j)),
        decryptJson: jest.fn(s => {
            try { return JSON.parse(s); } catch(e) { return s; }
        })
    }
}));

jest.mock('next-auth', () => ({
    getServerSession: jest.fn().mockResolvedValue({
        user: { role: 'ADMIN', id: 'admin-1' }
    })
}));

jest.mock('@/services/bot/bot-registry', () => ({
    BotRegistry: {
        get: jest.fn(() => ({
            telegram: {
                sendMessage: jest.fn().mockResolvedValue({})
            }
        }))
    }
}), { virtual: true });

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

/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { Decimal } from 'decimal.js';

export const userFactory = (overrides = {}) => ({
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    username: 'testuser',
    balance: new Decimal(100),
    spent: new Decimal(0),
    currency: 'RUB',
    role: 'USER',
    projectId: 'default',
    ledgerEntries: [],
    createdAt: new Date(),
    ...overrides
});

export const orderFactory = (overrides = {}) => ({
    id: Math.floor(Math.random() * 100000),
    externalId: `ext-${Math.random().toString(36).substr(2, 9)}`,
    status: 'COMPLETED',
    totalPrice: new Decimal(10),
    costPrice: new Decimal(5),
    projectId: 'default',
    createdAt: new Date(),
    internalServiceId: 'service-1',
    ...overrides
});

export const internalServiceFactory = (overrides = {}) => ({
    id: `service-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Service',
    pricePer1000: new Decimal(100),
    category: 'SUBSCRIBERS',
    platform: 'TELEGRAM',
    isActive: true,
    providerMappings: [],
    ...overrides
});

export const ledgerEntryFactory = (overrides = {}) => ({
    id: `ledger-${Math.random().toString(36).substr(2, 9)}`,
    userId: 'user-1',
    amount: new Decimal(10),
    type: 'ORDER_PAYMENT',
    currency: 'RUB',
    createdAt: new Date(),
    ...overrides
});

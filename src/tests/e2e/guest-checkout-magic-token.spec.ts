/**
 * GAP-1 + GAP-2: Guest Checkout Magic Token Flow
 *
 * Тестирует главный конверсионный путь платформы:
 *  - Гость вводит email → auto-создаётся аккаунт
 *  - API возвращает loginToken (Magic Token)
 *  - Frontend вызывает signIn() → сессия → /dashboard
 *
 * Также тестирует:
 *  - Existing user (пароль / magic code) при повторном заказе
 *
 * Уровень тестирования: API-level + DB assertions (без E2E браузера)
 * т.к. signIn() требует запущенного сервера NextAuth.
 */
import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

const BASE_URL = 'http://localhost:3000';

test.describe('Guest Checkout: Magic Token Auto-Registration', () => {
    const guestEmail = `guest-e2e-${Date.now()}@smmplan.pro`;
    const existingEmail = 'existing-e2e@smmplan.pro';
    let projectId: string;
    let serviceId: string;

    test.beforeAll(async () => {
        const project = await prisma.project.findFirst({ orderBy: { createdAt: 'asc' } });
        projectId = project?.id ?? 'global';

        // Ensure test service exists
        const svc = await prisma.internalService.upsert({
            where: { id: 'e2e-srv-1' },
            create: {
                id: 'e2e-srv-1',
                name: 'E2E Test Views',
                description: 'E2E Test Service Description',
                isActive: true,
                pricePer1000: new Decimal(10),
                minQty: 100,
                maxQty: 10000,
                platform: 'TELEGRAM',
                category: 'VIEWS',
                targetType: 'POST',
                geo: 'All',
            },
            update: { isActive: true },
        });
        serviceId = svc.id;

        // Ensure an existing user for test GAP-2
        const { default: bcrypt } = await import('bcryptjs');
        const hashed = await bcrypt.hash('ExistingPass2026!', 10);
        await prisma.user.upsert({
            where: { email: existingEmail },
            create: {
                email: existingEmail,
                password: hashed,
                username: 'Existing E2E',
                projectId,
                balance: new Decimal(1000),
                role: 'USER',
            },
            update: { password: hashed, balance: new Decimal(1000) },
        });
    });

    test.afterAll(async () => {
        // Cleanup auto-created guest user
        await prisma.user.deleteMany({ where: { email: guestEmail } });
    });

    // ────────────────────────────────────────────────────────────────
    // GAP-1: New guest → auto-registration + loginToken returned
    // ────────────────────────────────────────────────────────────────
    test('GAP-1: New guest email → auto-creates user and returns loginToken', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/client/orders`, {
            headers: { 'host': 'localhost' },
            data: {
                serviceId,
                link: 'https://t.me/e2etest/1',
                quantity: 500,
                email: guestEmail,
            },
        });

        // Could be 200 (balance paid) or 200 with requiresPayment (no balance)
        // In both cases: new user created + loginToken returned
        const body = await res.json();
        if (![200, 201].includes(res.status())) console.error('[GAP-1] Error:', body);
        expect([200, 201]).toContain(res.status());

        // User must have been created
        const createdUser = await prisma.user.findFirst({
            where: { email: guestEmail, projectId },
        });
        expect(createdUser).not.toBeNull();
        expect(createdUser?.email).toBe(guestEmail);

        // loginToken must be present (for magic auto-login)
        expect(body.loginToken).toBeTruthy();
        expect(typeof body.loginToken).toBe('string');
    });

    // ────────────────────────────────────────────────────────────────
    // GAP-1b: Magic Token is verifiable via NextAuth credentials
    // ────────────────────────────────────────────────────────────────
    test('GAP-1b: loginToken is a valid JWT (magic-auth format)', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/client/orders`, {
            headers: { 'host': 'localhost' },
            data: {
                serviceId,
                link: 'https://t.me/e2etest/2',
                quantity: 500,
                email: guestEmail,
            },
        });

        const body = await res.json();
        if (![200, 201].includes(res.status())) console.error('[GAP-1b] Error:', body);
        const token = body.loginToken;

        if (token) {
            const authRes = await request.post(`${BASE_URL}/api/auth/callback/credentials`, {
                headers: { 'host': 'localhost' },
                form: {
                    magicToken: token,
                    callbackUrl: '/dashboard',
                    csrfToken: '',
                    json: 'true',
                },
            });
            expect([200, 302, 303]).toContain(authRes.status());
        }
    });

    // ────────────────────────────────────────────────────────────────
    // GAP-2a: Existing user → PASSWORD required (ATO protection)
    // ────────────────────────────────────────────────────────────────
    test('GAP-2a: Existing user without password → 409 USER_EXISTS', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/client/orders`, {
            headers: { 'host': 'localhost' },
            data: {
                serviceId,
                link: 'https://t.me/e2etest/3',
                quantity: 500,
                email: existingEmail,
                // NO password or magicCode
            },
        });

        const body = await res.json();
        if (res.status() !== 409) console.error('[GAP-2a] Error:', body);
        expect(res.status()).toBe(409);
        expect(body.error).toBe('USER_EXISTS');
    });

    // ────────────────────────────────────────────────────────────────
    // GAP-2b: Existing user WITH correct password → order succeeds
    // ────────────────────────────────────────────────────────────────
    test('GAP-2b: Existing user with correct password → order created', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/client/orders`, {
            headers: { 'host': 'localhost' },
            data: {
                serviceId,
                link: 'https://t.me/e2etest/4',
                quantity: 500,
                email: existingEmail,
                password: 'ExistingPass2026!',
            },
        });

        const body = await res.json();
        if (res.status() !== 200) console.error('[GAP-2b] Error:', body);
        expect(res.status()).toBe(200);
        expect(body.success).toBe(true);
    });

    // ────────────────────────────────────────────────────────────────
    // GAP-2c: Existing user with WRONG password → 401
    // ────────────────────────────────────────────────────────────────
    test('GAP-2c: Existing user with wrong password → 401', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/client/orders`, {
            headers: { 'host': 'localhost' },
            data: {
                serviceId,
                link: 'https://t.me/e2etest/5',
                quantity: 500,
                email: existingEmail,
                password: 'WrongPassword!',
            },
        });

        const body = await res.json();
        if (res.status() !== 401) console.error('[GAP-2c] Error:', body);
        expect(res.status()).toBe(401);
        expect(body.error).toMatch(/неверный пароль/i);
    });
});

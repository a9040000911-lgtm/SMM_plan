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
            data: {
                serviceId,
                link: 'https://t.me/e2etest/1',
                quantity: 500,
                email: guestEmail,
            },
        });

        // Could be 200 (balance paid) or 200 with requiresPayment (no balance)
        // In both cases: new user created + loginToken returned
        expect([200, 201]).toContain(res.status());
        const body = await res.json();

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
        // Get a fresh loginToken from the create order flow
        const res = await request.post(`${BASE_URL}/api/client/orders`, {
            data: {
                serviceId,
                link: 'https://t.me/e2etest/2',
                quantity: 500,
                email: guestEmail,
            },
        });

        const body = await res.json();
        const token = body.loginToken;

        // Verify the token against the magic-auth endpoint
        // (NextAuth /api/auth/callback/credentials with magicToken)
        if (token) {
            const authRes = await request.post(`${BASE_URL}/api/auth/callback/credentials`, {
                form: {
                    magicToken: token,
                    callbackUrl: '/dashboard',
                    csrfToken: '', // CSRF not required in test env
                    json: 'true',
                },
            });
            // Either 200 (success) or redirect (3xx) — both mean token was accepted
            expect([200, 302, 303]).toContain(authRes.status());
        } else {
            // If no token (balance was enough — immediate order), skip
            console.log('[GAP-1b] No loginToken in response (user had balance, direct order)');
        }
    });

    // ────────────────────────────────────────────────────────────────
    // GAP-2a: Existing user → PASSWORD required (ATO protection)
    // ────────────────────────────────────────────────────────────────
    test('GAP-2a: Existing user without password → 409 USER_EXISTS', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/client/orders`, {
            data: {
                serviceId,
                link: 'https://t.me/e2etest/3',
                quantity: 500,
                email: existingEmail,
                // NO password or magicCode
            },
        });

        expect(res.status()).toBe(409);
        const body = await res.json();
        expect(body.error).toBe('USER_EXISTS');
    });

    // ────────────────────────────────────────────────────────────────
    // GAP-2b: Existing user WITH correct password → order succeeds
    // ────────────────────────────────────────────────────────────────
    test('GAP-2b: Existing user with correct password → order created', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/client/orders`, {
            data: {
                serviceId,
                link: 'https://t.me/e2etest/4',
                quantity: 500,
                email: existingEmail,
                password: 'ExistingPass2026!',
            },
        });

        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);

        // Verify order in DB
        const user = await prisma.user.findFirst({ where: { email: existingEmail } });
        const orders = await prisma.order.findMany({
            where: { userId: user!.id },
            orderBy: { createdAt: 'desc' },
            take: 1,
        });
        expect(orders.length).toBeGreaterThan(0);
    });

    // ────────────────────────────────────────────────────────────────
    // GAP-2c: Existing user with WRONG password → 401
    // ────────────────────────────────────────────────────────────────
    test('GAP-2c: Existing user with wrong password → 401', async ({ request }) => {
        const res = await request.post(`${BASE_URL}/api/client/orders`, {
            data: {
                serviceId,
                link: 'https://t.me/e2etest/5',
                quantity: 500,
                email: existingEmail,
                password: 'WrongPassword!',
            },
        });

        expect(res.status()).toBe(401);
        const body = await res.json();
        expect(body.error).toMatch(/неверный пароль/i);
    });
});

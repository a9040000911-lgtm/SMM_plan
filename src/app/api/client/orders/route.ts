/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from "@/auth";

import { getClientProjectId } from '@/utils/project-resolver';
import bcrypt from 'bcryptjs';
import { PaymentService } from '@/services/finance';
import { sendCredentialsEmail } from '@/services/mail.service';
import { Decimal } from 'decimal.js';
import { UnifiedNotificationService } from '@/services/core/notification.service';

import { LinkService } from '@/services/providers';
import { OrderQueueService } from '@/services/orders/order-queue.service';
import { checkRateLimit, getRealIp } from '@/services/core/rate-limiter';

interface BatchItem {
    serviceId: string;
    link: string;
    quantity: number;
    isDripFeed?: boolean;
    runs?: number;
    interval?: number;
}

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const projectId = await getClientProjectId();
        if (!projectId) return NextResponse.json({ error: "Project context missing" }, { status: 400 });

        const user = await prisma.user.findFirst({
            where: { email: session.user.email, projectId: projectId }
        });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Pagination
        const url = new URL(req.url);
        const page = Math.max(parseInt(url.searchParams.get('page') || '1'), 1);
        const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '10'), 1), 100); // SECURITY: Cap at 100 to prevent OOM DoS
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: skip,
                select: {
                    id: true,
                    link: true,
                    quantity: true,
                    totalPrice: true,
                    status: true,
                    initialCount: true,
                    remains: true,
                    createdAt: true,
                    internalService: {
                        select: {
                            name: true,
                            isCancelEnabled: true,
                            isRefillEnabled: true,
                            serviceCategory: { select: { categoryType: true } },
                            socialPlatform: { select: { slug: true } }
                        }
                    }
                }
            }),
            prisma.order.count({ where: { userId: user.id } })
        ]);

        const { encodePublicId } = await import('@/utils/id-obfuscator');

        return NextResponse.json({
            orders: orders.map(o => ({
                id: o.id,
                publicId: encodePublicId(o.id),
                serviceName: o.internalService.name,
                category: o.internalService.serviceCategory?.categoryType || 'OTHER',
                platform: o.internalService.socialPlatform?.slug?.toUpperCase() || 'OTHER',
                isCancelEnabled: o.internalService.isCancelEnabled || false,
                isRefillEnabled: o.internalService.isRefillEnabled || false,
                link: o.link,
                quantity: o.quantity,
                price: o.totalPrice,
                status: o.status,
                initialCount: o.initialCount,
                remains: o.remains,
                createdAt: o.createdAt
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error('[API Client Orders Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // Rate Limit Protection
        const ip = getRealIp(req);
        const rl = await checkRateLimit('api', ip);
        if (!rl.success) {
            return NextResponse.json(
                { error: 'Слишком много запросов. Пожалуйста, подождите.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
            );
        }

        const rawBody = await req.json();
        
        // [SECURITY] Zod Schema Validation
        const { clientCheckoutSchema, safeParse } = await import('@/lib/schemas/api');
        const parsed = safeParse(clientCheckoutSchema, rawBody);
        
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error }, { status: 400 });
        }
        
        const body = parsed.data as any;

        // --- OMNI-INPUT: Convert links array to items array ---
        if (body.links && Array.isArray(body.links) && body.links.length > 0 && !body.items) {
            body.items = body.links.map((link: string) => ({
                serviceId: body.serviceId,
                link,
                quantity: body.quantity,
                isDripFeed: body.isDripFeed,
                runs: body.runs,
                interval: body.interval
            }));
        }

        // --- BATCH PROCESSING ---
        const items = body.items || body.batch;
        if (items && Array.isArray(items) && items.length > 0) {
            const projectId = await getClientProjectId();
            if (!projectId) return NextResponse.json({ error: "Context missing" }, { status: 400 });

            // 1. Resolve User
            let userId: string;
            const session = await auth();
            const userEmail = session?.user?.email || body.email;

            if (session?.user?.email) {
                const user = await prisma.user.findFirst({ where: { email: session.user.email, projectId } });
                if (!user) return NextResponse.json({ error: 'Auth user not found' }, { status: 404 });
                userId = user.id;
            } else {
                if (!userEmail) return NextResponse.json({ error: 'Email required' }, { status: 400 });
                const existing = await prisma.user.findFirst({ where: { email: userEmail.toLowerCase(), projectId } });
                
                if (existing) {
                    // SECURITY: Always require authentication for existing users
                    const { password, magicCode } = body;
                    if (password) {
                        const isValid = await bcrypt.compare(password, existing.password || '');
                        if (!isValid) return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });
                        userId = existing.id;
                    } else if (magicCode) {
                        const { CheckoutAuthService } = await import('@/services/core/checkout-auth.service');
                        const verify = await CheckoutAuthService.verifyCode(userEmail, magicCode, projectId);
                        if (!verify.success) return NextResponse.json({ error: verify.error || 'Неверный код' }, { status: 401 });
                        userId = existing.id;
                    } else {
                        // HARDENED: Always require auth for existing accounts to prevent Account Takeover
                        return NextResponse.json({ 
                            error: 'USER_EXISTS', 
                            message: 'Для этого email уже существует аккаунт. Пожалуйста, введите пароль или запросите код из письма для подтверждения личности.' 
                        }, { status: 409 });
                    }
                } else {
                    const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
                    const hashedPassword = await bcrypt.hash(generatedPassword, 10);
                    const newUser = await prisma.user.create({
                        data: { email: userEmail.toLowerCase(), password: hashedPassword, username: userEmail.split('@')[0], projectId, balance: 0 }
                    });
                    userId = newUser.id;
                    await sendCredentialsEmail(userEmail, generatedPassword);
                }
            }

            // 2. Validate Items & Calculate Total
            let totalBatchPrice = new Decimal(0);
            const preparedOrders: { service: any, item: BatchItem, price: number, warning?: string }[] = [];

            for (const item of items) {
                const { serviceId, link, quantity, isDripFeed: _isDripFeed, runs: _runs, interval: _interval } = item;
                if (!serviceId || !link || !quantity) return NextResponse.json({ error: 'Missing fields in item' }, { status: 400 });

                // Flexible lookup: by string id or by numericId
                const isNumericSid = !isNaN(parseInt(serviceId));
                const service = await prisma.internalService.findFirst({
                    where: {
                        OR: [
                            { id: serviceId },
                            ...(isNumericSid ? [{ numericId: parseInt(serviceId) }] : [])
                        ],
                        isActive: true
                    },
                    include: { socialPlatform: true }
                });

                if (!service) return NextResponse.json({ error: `Service ${serviceId} not found` }, { status: 404 });

                if (quantity < service.minQty || quantity > service.maxQty) {
                    return NextResponse.json({ error: `Quantity ${quantity} invalid for service ${service.name} (${service.numericId})` }, { status: 400 });
                }

                // Batch Link Validation
                const svcPlatformEnum = (service.platform || service.socialPlatform?.slug?.toUpperCase() || 'OTHER') as import('@prisma/client').Platform;
                const validation = LinkService.validate(link, svcPlatformEnum, service.targetType, service.allowedTargetTypes);
                if (!validation.isValid) {
                    return NextResponse.json({ error: `Item ${service.name}: ${validation.error || 'Invalid link'}` }, { status: 400 });
                }

                // [GUARD-ZERO-PRICE] Reject free services (pricePer1000 = 0 means misconfiguration)
                if (new Decimal(service.pricePer1000).isZero()) {
                    return NextResponse.json({ error: `Service ${service.name} has no price configured. Please contact support.` }, { status: 422 });
                }

                const { PricingService } = await import('@/services/finance/pricing.service');
                const details = await PricingService.calculateOrderDetails(userId, service.id, quantity);
                const price = details.finalPrice.toNumber();

                totalBatchPrice = totalBatchPrice.plus(price);

                preparedOrders.push({
                    service,
                    item,
                    price,
                    warning: validation.warning
                });
            }

            // 3. Check Balance (If Auth)
            if (session) {
                let paidFromBalance = false;

                try {
                    // Pay from balance (Atomic)
                    await prisma.$transaction(async (tx) => {
                        const freshUser = await tx.user.findUnique({ where: { id: userId }, select: { balance: true } });
                        if (!freshUser || freshUser.balance.lt(totalBatchPrice)) {
                            throw new Error('INSUFFICIENT_FUNDS');
                        }

                        // Атомарное списание
                        const updated = await tx.user.updateMany({
                            where: { id: userId, balance: { gte: totalBatchPrice } },
                            data: { balance: { decrement: totalBatchPrice }, spent: { increment: totalBatchPrice } }
                        });

                        if (updated.count === 0) {
                            throw new Error('INSUFFICIENT_FUNDS');
                        }

                        const balanceAfter = freshUser.balance.minus(totalBatchPrice);
                        const balanceBefore = freshUser.balance;

                        const referenceId = `BATCH_PAY_${userId}_${Date.now()}`;
                        await tx.ledgerEntry.create({
                             data: {
                                 projectId, userId,
                                 amount: totalBatchPrice,
                                 referenceId,
                                 type: 'WITHDRAWAL',
                                 balanceBefore,
                                 balanceAfter,
                                 description: `Оплата пакета заказов (${preparedOrders.length} шт.)`
                             }
                        });

                        for (const p of preparedOrders) {
                            const order = await tx.order.create({
                                data: {
                                    projectId, userId,
                                    internalServiceId: p.service.id,
                                    link: p.item.link,
                                    quantity: p.item.quantity,
                                    totalPrice: p.price,
                                    costPrice: p.service.lastProviderPrice,
                                    status: 'PENDING',
                                    isDripFeed: !!p.item.isDripFeed,
                                    runs: p.item.isDripFeed ? Number(p.item.runs) : 1,
                                    interval: p.item.isDripFeed ? Number(p.item.interval) : 0,
                                    currentRun: 0,
                                    metadata: p.warning ? { warning: p.warning } : undefined
                                }
                            });

                            await tx.adminLog.create({
                                data: {
                                    adminId: userId,
                                    action: "CREATE_BATCH",
                                    targetId: order.id.toString(),
                                    details: `Заказ создан в пакете. Сервис: ${p.service.name}`
                                }
                            });
                        }
                    });
                    paidFromBalance = true;
                } catch (e: any) {
                    if (e.message !== 'INSUFFICIENT_FUNDS') {
                        throw e; // Если реальная БД ошибка — пробрасываем выше
                    }
                    // Иначе просто идём дальше создавать AWAITING_PAYMENT заказы
                }

                if (paidFromBalance) {
                    // Trigger asynchronous non-blocking background queue execution instantly 
                    process.nextTick(() => {
                        OrderQueueService.processPendingOrders().catch((e: any) => console.error('[Batch OrderQueue Error]', e));
                    });
                    return NextResponse.json({ success: true, requiresPayment: false });
                }
            }

            // 4. Create AWAITING_PAYMENT Orders
            const createdOrderIds: number[] = [];
            await prisma.$transaction(async (tx) => {
                for (const p of preparedOrders) {
                    const o = await tx.order.create({
                        data: {
                            projectId, userId,
                            internalServiceId: p.service.id,
                            link: p.item.link,
                            quantity: p.item.quantity,
                            totalPrice: p.price,
                            costPrice: 0,
                            status: 'AWAITING_PAYMENT' as any,
                            isDripFeed: !!p.item.isDripFeed,
                            runs: p.item.isDripFeed ? Number(p.item.runs) : 1,
                            interval: p.item.isDripFeed ? Number(p.item.interval) : 0,
                            currentRun: 0,
                            metadata: p.warning ? { warning: p.warning } : undefined
                        }
                    });
                    createdOrderIds.push(o.id);
                }
            });

            // 5. Create Transaction
            const tx = await prisma.transaction.create({
                data: {
                    projectId, userId,
                    amount: totalBatchPrice,
                    provider: 'YOOKASSA',
                    status: 'PENDING',
                    type: 'DEPOSIT',
                    metadata: {
                        orderIds: createdOrderIds,
                        source: 'WEB_BATCH'
                    }
                }
            });

            // 6. Payment Link
            const project = await prisma.project.findUnique({ where: { id: projectId } });
            const paymentSettings = (project?.paymentSettings as any) || {};
            let credentials = { shopId: paymentSettings.shopId, secretKey: paymentSettings.secretKey };
            if (paymentSettings.mode === 'TEST') {
                credentials = { shopId: paymentSettings.testShopId, secretKey: paymentSettings.testSecretKey };
            }

            const returnUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/orders`;

            const paymentRes = await PaymentService.createPayment(
                totalBatchPrice.toNumber(),
                `Оплата заказа (пакет услуг): ${createdOrderIds.length} шт.`,
                tx.id,
                credentials,
                returnUrl,
                'WEB',
                userEmail
            );

            if (!paymentRes.success || !paymentRes.confirmationUrl) return NextResponse.json({ error: 'Payment provider error' }, { status: 500 });

            await prisma.transaction.update({ where: { id: tx.id }, data: { externalId: paymentRes.paymentId } });

            // 7. Return response with Magic Token for Guests
            const { signMagicToken } = await import('@/services/core/magic-auth');
            const loginToken = await signMagicToken({
                userId,
                tgId: '',
                projectId
            });

            return NextResponse.json({
                success: true,
                requiresPayment: true,
                paymentUrl: paymentRes.confirmationUrl,
                loginToken
            });
        }

        // --- EXISTING SINGLE ORDER LOGIC ---
        const { 
            serviceId, link, quantity, email, 
            isDripFeed, runs, interval, 
            scheduleTime, repeatInterval,
            password, magicCode // Added for seamless auth
        } = body;

        const projectId = await getClientProjectId();
        if (!projectId) return NextResponse.json({ error: "Context missing" }, { status: 400 });

        const mCheck = await prisma.project.findUnique({ where: { id: projectId }, select: { maintenanceMode: true } });
        if (mCheck?.maintenanceMode) {
            return NextResponse.json({ error: 'Платформа временно на техническом обслуживании. Пожалуйста, попробуйте позже.' }, { status: 503 });
        }

        if (!serviceId || !link || !quantity) {
            return NextResponse.json({ error: 'Missing Required Fields' }, { status: 400 });
        }

        // Drip Feed Validation
        if (isDripFeed) {
            if (!runs || runs < 2) return NextResponse.json({ error: 'Количество запусков должно быть не менее 2' }, { status: 400 });
            if (runs > 100) return NextResponse.json({ error: 'Максимум 100 запусков в drip-feed' }, { status: 400 });
            if (!interval || interval < 1) return NextResponse.json({ error: 'Интервал должен быть не менее 1 минуты' }, { status: 400 });
            if (interval > 1440) return NextResponse.json({ error: 'Максимальный интервал — 1440 минут (24 часа)' }, { status: 400 });
        }

        // 1. Resolve User
        let userId: string;
        const session = await auth();
        if (session?.user?.email) {
            const user = await prisma.user.findFirst({ where: { email: session.user.email, projectId } });
            if (!user) return NextResponse.json({ error: 'Auth user not found' }, { status: 404 });
            userId = user.id;
        } else {
            if (!email) return NextResponse.json({ error: 'Email required for guest order' }, { status: 400 });
            const existing = await prisma.user.findFirst({ where: { email: email.toLowerCase(), projectId } });
            
            if (existing) {
                // SECURITY: Always require authentication for existing users
                if (password) {
                    const isValid = await bcrypt.compare(password, existing.password || '');
                    if (!isValid) return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });
                    userId = existing.id;
                } else if (magicCode) {
                    const { CheckoutAuthService } = await import('@/services/core/checkout-auth.service');
                    const verify = await CheckoutAuthService.verifyCode(email, magicCode, projectId);
                    if (!verify.success) return NextResponse.json({ error: verify.error || 'Неверный код' }, { status: 401 });
                    userId = existing.id;
                } else {
                    // HARDENED: Always require auth for existing accounts to prevent Account Takeover
                    return NextResponse.json({ 
                        error: 'USER_EXISTS', 
                        message: 'Для этого email уже существует аккаунт. Пожалуйста, введите пароль или запросите код из письма для подтверждения личности.' 
                    }, { status: 409 });
                }
            } else {
                // New user creation
                const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
                const hashedPassword = await bcrypt.hash(generatedPassword, 10);
                const newUser = await prisma.user.create({
                    data: { 
                        email: email.toLowerCase(), 
                        password: hashedPassword, 
                        username: email.split('@')[0], 
                        projectId, 
                        balance: 0 
                    }
                });
                await sendCredentialsEmail(email, generatedPassword);
                userId = newUser.id;
            }
        }

        // 2. Fetch Service with Flexible Lookup
        const isNumericSid = !isNaN(parseInt(serviceId));
        const service = await prisma.internalService.findFirst({
            where: {
                OR: [
                    { id: serviceId },
                    ...(isNumericSid ? [{ numericId: parseInt(serviceId) }] : [])
                ],
                isActive: true
            },
            include: { socialPlatform: true }
        });

        if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

        if (quantity < service.minQty || quantity > service.maxQty) {
            return NextResponse.json({ error: `Quantity must be between ${service.minQty} and ${service.maxQty}` }, { status: 400 });
        }

        // 3. Link Validation
        const singleSvcPlatformEnum = (service.platform || service.socialPlatform?.slug?.toUpperCase() || 'OTHER') as import('@prisma/client').Platform;
        const validation = LinkService.validate(link, singleSvcPlatformEnum, service.targetType, service.allowedTargetTypes);
        if (!validation.isValid) {
            return NextResponse.json({ error: validation.error || 'Invalid link for this service' }, { status: 400 });
        }

        const pricePer1000 = new Decimal(service.pricePer1000.toString());

        // [GUARD-ZERO-PRICE] Reject free services (pricePer1000 = 0 means misconfiguration)
        if (pricePer1000.isZero()) {
            return NextResponse.json({ error: `Service ${service.name} has no price configured. Please contact support.` }, { status: 422 });
        }

        const { PricingService } = await import('@/services/finance/pricing.service');
        const details = await PricingService.calculateOrderDetails(userId, service.id, quantity);
        const totalPrice = details.finalPrice;

        // 4. Scheduling Logic
        if (scheduleTime) {
            const scheduledDate = new Date(scheduleTime);
            if (scheduledDate <= new Date()) {
                return NextResponse.json({ error: 'Время начала должно быть в будущем' }, { status: 400 });
            }

            const scheduledOrder = await prisma.scheduledOrder.create({
                data: {
                    projectId,
                    userId,
                    serviceId,
                    link,
                    quantity,
                    totalPrice,
                    costPrice: service.lastProviderPrice,
                    scheduleTime: scheduledDate,
                    repeatInterval: repeatInterval ? Number(repeatInterval) : null,
                    status: 'PENDING'
                }
            });

            return NextResponse.json({ success: true, requiresPayment: false, scheduledOrderId: scheduledOrder.id });
        }

        // 4. Payment Logic
        if (session) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user && user.balance.gte(totalPrice)) {
                const balanceBefore = user.balance;
                const balanceAfter = user.balance.minus(totalPrice);
                
                await prisma.$transaction(async (tx) => {
                    const updated = await tx.user.updateMany({
                        where: { id: userId, balance: { gte: totalPrice } },
                        data: { balance: { decrement: totalPrice }, spent: { increment: totalPrice } }
                    });

                    if (updated.count === 0) {
                        throw new Error('Недостаточно средств на балансе.');
                    }

                    const referenceId = `ORDER_PAY_${userId}_${Date.now()}`;
                    await tx.ledgerEntry.create({
                         data: {
                             projectId, userId,
                             amount: totalPrice,
                             referenceId,
                             type: 'WITHDRAWAL',
                             balanceBefore,
                             balanceAfter,
                             description: `Оплата заказа: ${service.name}`
                         }
                    });

                    const order = await tx.order.create({
                        data: {
                            projectId, userId, internalServiceId: service.id,
                            link, quantity, totalPrice, costPrice: service.lastProviderPrice,
                            status: 'PENDING', isDripFeed: !!isDripFeed,
                            runs: isDripFeed ? Number(runs) : 1,
                            interval: isDripFeed ? Number(interval) : 0,
                            currentRun: 0,
                            metadata: validation.warning ? { warning: validation.warning } : undefined
                        }
                    });

                    await tx.adminLog.create({
                        data: {
                            adminId: userId,
                            action: "CREATE",
                            targetId: order.id.toString(),
                            details: `Заказ создан. Сервис: ${service.name}`
                        }
                    });
                });
                // Trigger asynchronous non-blocking background queue execution instantly
                // 2026: Notify via Unified Service (MAX -> TG -> Email)
                process.nextTick(() => {
                    OrderQueueService.processPendingOrders().catch(e => console.error('[Single OrderQueue Error]', e));
                    UnifiedNotificationService.notifyAdmin(projectId, `🆕 <b>Новый заказ!</b>\nПользователь: ${user.email}\nСумма: ${totalPrice}₽`).catch(e => console.error('[Notification Error]', e));
                });
                return NextResponse.json({ success: true, requiresPayment: false });
            }
        }

        // 4. Create Order with AWAITING_PAYMENT status
        const order = await prisma.order.create({
            data: {
                projectId, userId, internalServiceId: service.id, // Use resolved service.id
                link, quantity, totalPrice, status: 'AWAITING_PAYMENT' as any,
                costPrice: 0, isDripFeed: !!isDripFeed,
                runs: isDripFeed ? Number(runs) : 1,
                interval: isDripFeed ? Number(interval) : 0,
                currentRun: 0,
                metadata: validation.warning ? { warning: validation.warning } : undefined
            }
        });

        // 5. Create Transaction
        const tx = await prisma.transaction.create({
            data: {
                projectId, userId, amount: totalPrice, provider: 'YOOKASSA', status: 'PENDING', type: 'DEPOSIT',
                metadata: { orderId: order.id, serviceId, qty: quantity, link, projectId, source: 'WEB' }
            }
        });

        // 5. Payment Link
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        const paymentSettings = (project?.paymentSettings as any) || {};
        let credentials = { shopId: paymentSettings.shopId, secretKey: paymentSettings.secretKey };
        if (paymentSettings.mode === 'TEST') {
            credentials = { shopId: paymentSettings.testShopId, secretKey: paymentSettings.testSecretKey };
        }

        const returnUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/orders`;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        const paymentRes = await PaymentService.createPayment(
            totalPrice.toNumber(), `Оплата заказа: ${service.name} (${quantity} шт.)`,
            tx.id, credentials, returnUrl, 'WEB', user?.email || undefined
        );

        if (!paymentRes.success || !paymentRes.confirmationUrl) return NextResponse.json({ error: 'Payment provider error' }, { status: 500 });

        await prisma.transaction.update({ where: { id: tx.id }, data: { externalId: paymentRes.paymentId } });

        // 6. Return response with optional magic login token
        const { signMagicToken } = await import('@/services/core/magic-auth');
        const loginToken = await signMagicToken({
            userId,
            tgId: '', // We don't have TG ID here easily, but it's not strictly required for web session
            projectId
        });

        return NextResponse.json({ 
            success: true, 
            requiresPayment: true, 
            paymentUrl: paymentRes.confirmationUrl,
            loginToken // Frontend will use this to call signIn('credentials', { magicToken: loginToken })
        });

    } catch (_e) {
        console.error('[Create Order Error]', _e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}



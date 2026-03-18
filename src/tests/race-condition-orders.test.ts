/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Race Condition Stress Test for Order Initiation
 */

import { prisma } from '../lib/prisma';
import { OrderActivationService } from '../services/orders/order-activation.service';
import { Decimal } from 'decimal.js';
import { OrderInitiateData } from '../types/orders';

describe('Race Condition: Order Initiation', () => {
    let testUser: any;
    let testService: any;
    let testProject: any;

    beforeAll(async () => {
        // Setup test data
        testProject = await prisma.project.create({
            data: {
                name: 'Stress Test Project',
                slug: 'stress-test-' + Date.now(),
                domain: 'stress' + Date.now() + '.com',
            }
        });

        testUser = await prisma.user.create({
            data: {
                email: 'stress@test.com',
                username: 'stress_user',
                balance: new Decimal(100), // Exactly 100 RUB
                projectId: testProject.id
            }
        });

        testService = await prisma.internalService.create({
            data: {
                name: 'Stress Test Service',
                platform: 'TELEGRAM',
                type: 'REGULAR',
                targetType: 'CHANNEL',
                pricePer1000: new Decimal(100), // Exactly 100 RUB per 1000
                lastProviderPrice: new Decimal(50),
                isActive: true,
                min: 100,
                max: 10000,
            }
        });
    });

    afterAll(async () => {
        // Cleanup if needed
        // await prisma.order.deleteMany({ where: { userId: testUser.id } });
        // await prisma.user.delete({ where: { id: testUser.id } });
    });

    it('should only allow ONE order when multiple requests hit simultaneously with limited balance', async () => {
        const orderData: OrderInitiateData = {
            userId: testUser.id,
            projectId: testProject.id,
            serviceId: testService.id,
            qty: 1000,
            totalPrice: new Decimal(100),
            link: 'https://t.me/test_channel',
            username: 'stress_user'
        };

        console.log('[StressTest] Launching 10 concurrent order requests...');
        
        // Launch 10 requests at the exact same time
        const results = await Promise.allSettled([
            OrderActivationService.initiateOrder(orderData),
            OrderActivationService.initiateOrder(orderData),
            OrderActivationService.initiateOrder(orderData),
            OrderActivationService.initiateOrder(orderData),
            OrderActivationService.initiateOrder(orderData),
            OrderActivationService.initiateOrder(orderData),
            OrderActivationService.initiateOrder(orderData),
            OrderActivationService.initiateOrder(orderData),
            OrderActivationService.initiateOrder(orderData),
            OrderActivationService.initiateOrder(orderData),
        ]);

        const successful = results.filter(r => r.status === 'fulfilled');
        const failed = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];

        if (failed.length > 0) {
            console.log('[StressTest] First failure reason:', failed[0].reason);
        }

        console.log(`[StressTest] Results: ${successful.length} success, ${failed.length} failed`);

        // ASSERTIONS
        expect(successful.length).toBe(1); // ONLY ONE should succeed
        expect(failed.length).toBe(9); // 9 should fail due to insufficient balance

        const finalUser = await prisma.user.findUnique({ where: { id: testUser.id } });
        expect(finalUser?.balance.toNumber()).toBe(0); // Balance should be exactly 0, not negative
        
        const orderCount = await prisma.order.count({ where: { userId: testUser.id } });
        expect(orderCount).toBe(1); // Only 1 order record in DB
    });
});

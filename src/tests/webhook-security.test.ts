/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { POST as robokassaHandler } from '@/app/api/webhooks/robokassa/route';
import { POST as yookassaHandler } from '@/app/api/webhooks/yookassa/route';
import { prisma } from '@/lib/prisma';
import { RobokassaService } from '@/services/payments/robokassa.service';
import { PaymentService } from '@/services/finance/payment.service';
import { confirmPayment } from '@/services/orders/order-processor.service';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        transaction: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
        },
        user: {
            update: jest.fn(),
        },
        ledgerEntry: {
            create: jest.fn(),
        },
        $transaction: jest.fn((cb: any) => {
            const innerMock: any = {
                transaction: {
                    findUnique: jest.fn(),
                    findFirst: jest.fn(),
                    update: jest.fn(),
                },
                user: { update: jest.fn() },
                ledgerEntry: { create: jest.fn() }
            };
            return cb(innerMock);
        }),
    }
}));

const mockedPrisma = prisma as any;

jest.mock('@/services/payments/robokassa.service', () => ({
    RobokassaService: {
        verifySignature: jest.fn(),
    },
}));

jest.mock('@/services/finance/payment.service', () => ({
    PaymentService: {
        getPaymentStatus: jest.fn(),
    },
}));

jest.mock('@/services/orders/order-processor.service', () => ({
    confirmPayment: jest.fn(),
}));

describe('Payment Webhook Security', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Robokassa Webhook', () => {
        test('Should reject if signature is invalid', async () => {
            const formData = new FormData();
            formData.append('OutSum', '100.00');
            formData.append('InvId', 'tx-123');
            formData.append('SignatureValue', 'WRONG_SIGNATURE');

            mockedPrisma.transaction.findUnique.mockResolvedValue({
                id: 'tx-123',
                status: 'PENDING',
                user: { project: { paymentSettings: { robokassa: { password2: 'pass2', mode: 'PRODUCTION' } } } }
            });
            (RobokassaService.verifySignature as jest.Mock).mockReturnValue(false);

            const req = new NextRequest('http://localhost/api/webhooks/robokassa', {
                method: 'POST',
                body: formData
            });

            const res = await robokassaHandler(req);
            expect(res.status).toBe(400);
            const text = await res.text();
            expect(text).toContain('Invalid signature');
        });

        test('Should prevent double-crediting if transaction is already COMPLETED', async () => {
            const formData = new FormData();
            formData.append('OutSum', '100.00');
            formData.append('InvId', 'tx-123');
            formData.append('SignatureValue', 'VALID');

            mockedPrisma.transaction.findUnique.mockResolvedValue({
                id: 'tx-123',
                status: 'COMPLETED',
                user: { project: { paymentSettings: { robokassa: { password2: 'pass2', mode: 'PRODUCTION' } } } }
            });
            (RobokassaService.verifySignature as jest.Mock).mockReturnValue(true);

            const req = new NextRequest('http://localhost/api/webhooks/robokassa', {
                method: 'POST',
                body: formData
            });

            const res = await robokassaHandler(req);
            expect(res.status).toBe(200);
            expect(mockedPrisma.user.update).not.toHaveBeenCalled();
        });
    });

    describe('YooKassa Webhook', () => {
        test('Should reject if YooKassa API re-verification fails', async () => {
            const payload = {
                event: 'payment.succeeded',
                object: { id: 'yoo-123', status: 'succeeded' }
            };

            (PaymentService.getPaymentStatus as jest.Mock).mockResolvedValue({
                success: false,
                status: 'pending'
            });

            const req = new NextRequest('http://localhost/api/webhooks/yookassa', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const res = await yookassaHandler(req);
            expect(res.status).toBe(200); // Route returns 200 even if verify fails but is logged
            expect(confirmPayment).not.toHaveBeenCalled();
        });

        test('Should confirm payment if API re-verification is successful', async () => {
            const payload = {
                event: 'payment.succeeded',
                object: { id: 'yoo-123', status: 'succeeded' }
            };

            (PaymentService.getPaymentStatus as jest.Mock).mockResolvedValue({
                success: true,
                status: 'succeeded'
            });

            const req = new NextRequest('http://localhost/api/webhooks/yookassa', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const res = await yookassaHandler(req);
            expect(res.status).toBe(200);
            expect(confirmPayment).toHaveBeenCalledWith('yoo-123');
        });
    });
});

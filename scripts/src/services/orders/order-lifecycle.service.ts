/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Decimal } from 'decimal.js';
import { Prisma, OrderStatus } from '@/generated/client';

export class OrderLifecycleService {
    /**
     * Базовое создание записи заказа в БД.
     */
    static async createOrderRecord(tx: Prisma.TransactionClient, data: {
        projectId: string | null;
        userId: string;
        serviceId: string;
        link: string;
        qty: number;
        totalPrice: Decimal;
        costPrice?: Decimal;
        discountAmount?: Decimal;
        promoCodeId?: string | null;
        isDripFeed: boolean;
        runs: number;
        interval: number;
        isManual: boolean;
        inviteLink?: string | null;
    }) {
        return await tx.order.create({
            data: {
                projectId: data.projectId,
                userId: data.userId,
                internalServiceId: data.serviceId,
                link: data.link,
                inviteLink: data.inviteLink || null,
                quantity: data.qty,
                totalPrice: data.totalPrice,
                costPrice: data.costPrice || new Decimal(0),
                discountAmount: data.discountAmount || new Decimal(0),
                promoCodeId: data.promoCodeId || null,
                status: 'PENDING',
                isDripFeed: data.isDripFeed,
                runs: data.runs,
                interval: data.interval,
                currentRun: 0,
                isManual: data.isManual
            },
            include: { internalService: true }
        });
    }

    /**
     * Обновление статуса заказа и остатка.
     */
    static async updateStatus(tx: Prisma.TransactionClient, orderId: number, status: OrderStatus, remains: number, rawData?: any) {
        return await tx.order.update({
            where: { id: orderId },
            data: {
                status,
                remains,
                providerRawResponse: rawData || undefined,
                updatedAt: new Date()
            }
        });
    }
}

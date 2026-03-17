/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Decimal } from 'decimal.js';
import { Prisma, OrderStatus } from '@/generated/client';
import { prisma } from '@/lib/prisma';
import { ServiceResult } from '../types';

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

    /**
     * Возвращает список заказов пользователя.
     */
    static async getUserOrders(userId: string): Promise<ServiceResult<any[]>> {
        try {
            const orders = await prisma.order.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                include: {
                    internalService: {
                        select: {
                            name: true,
                            platform: true,
                        }
                    }
                }
            });
            return { success: true, data: orders };
        } catch (error: any) {
            return { success: false, error: { code: 'ORDERS_FETCH_FAILED', message: error.message } };
        }
    }

    /**
     * Возвращает детали конкретного заказа с проверкой владельца.
     */
    static async getOrderById(orderId: number, userId: string): Promise<ServiceResult<any>> {
        try {
            const order = await prisma.order.findFirst({
                where: { id: orderId, userId },
                include: { 
                    internalService: { 
                        select: { 
                            name: true, 
                            platform: true, 
                            category: true, 
                            requirements: true, 
                            numericId: true 
                        } 
                    } 
                }
            });

            if (!order) throw new Error('Заказ не найден');

            return { success: true, data: order };
        } catch (error: any) {
            return { success: false, error: { code: 'ORDER_NOT_FOUND', message: error.message } };
        }
    }

    /**
     * Gets scheduled orders for a user.
     */
    static async getScheduledOrders(userId: string): Promise<ServiceResult<any[]>> {
        try {
            const scheduledOrders = await prisma.scheduledOrder.findMany({
                where: { userId: userId },
                orderBy: { scheduleTime: 'asc' },
                include: {
                    service: {
                        select: {
                            name: true,
                            platform: true,
                        }
                    }
                }
            });
            return { success: true, data: scheduledOrders };
        } catch (error: any) {
            return {
                success: false,
                error: { code: 'SCHEDULED_ORDERS_FETCH_FAILED', message: error.message }
            };
        }
    }
}

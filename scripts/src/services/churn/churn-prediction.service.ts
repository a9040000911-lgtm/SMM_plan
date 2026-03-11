/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import Decimal from 'decimal.js';
import { AutoRefillService } from './auto-refill.service';

/**
 * Churn Prediction Service (Phase 11)
 * Generates churn forecasts and recommended actions
 * ML-ready structure for future enhancement
 */

export class ChurnPredictionService {
    /**
     * Generate churn forecast for an order
     * Uses simple moving average for MVP, ML model later
     * 
     * Returns null if insufficient data (need at least 3 snapshots)
     */
    static async generatePrediction(orderId: number) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                churnSnapshots: {
                    orderBy: { snapshotDate: 'desc' },
                    take: 10
                },
                user: {
                    select: {
                        id: true,
                        tgId: true,
                        email: true
                    }
                }
            }
        });

        if (!order || order.churnSnapshots.length < 3) {
            console.log(`[ChurnPrediction] Insufficient data for order ${orderId} (${order?.churnSnapshots.length || 0} snapshots)`);
            return null;
        }

        // Calculate moving average of recent dropoff rates
        const recentSnapshots = order.churnSnapshots.slice(0, 3);
        const avgDropoffRate = recentSnapshots.reduce((sum, s) =>
            sum + Number(s.dropoffRate), 0
        ) / recentSnapshots.length;

        // Forecast churn for next 7 days (multiply daily rate by 7)
        const predictedChurn = new Decimal(avgDropoffRate * 7);

        // Confidence score: more data = higher confidence (max 1.0)
        const confidenceScore = new Decimal(
            Math.min(order.churnSnapshots.length / 10, 1.0)
        );

        // Determine recommended action based on predicted churn
        let recommendedAction: 'REFILL_NOW' | 'MONITOR' | 'OK';
        if (predictedChurn.greaterThan(20)) {
            recommendedAction = 'REFILL_NOW';
        } else if (predictedChurn.greaterThan(10)) {
            recommendedAction = 'MONITOR';
        } else {
            recommendedAction = 'OK';
        }

        // Save prediction to database
        const prediction = await prisma.churnPrediction.create({
            data: {
                orderId,
                predictedChurn,
                confidenceScore,
                recommendedAction,
                notificationSent: false
            }
        });

        console.log(`[ChurnPrediction] Order ${orderId}: ${predictedChurn.toFixed(2)}% predicted churn (${recommendedAction})`);

        // Send notification if critical
        if (recommendedAction === 'REFILL_NOW') {
            await this.notifyUserChurnRisk(order.user.id, order.id, predictedChurn.toNumber());

            // --- CHURN SHIELD: AUTO-REFILL TRIGGER ---
            const initial = order.initialCount || 0;
            const current = order.currentCount || initial;
            const drop = Math.max(initial - current, 0);

            if (drop > 0) {
                // Пытаемся восстановить то, что уже списалось
                await AutoRefillService.triggerRefill(order.id, drop);
            }
            // -----------------------------------------

            // Mark notification as sent
            await prisma.churnPrediction.update({
                where: { id: prediction.id },
                data: { notificationSent: true }
            });
        }

        return prediction;
    }

    /**
     * Batch predict for all active orders with warranty
     * Should be run daily via cron
     */
    static async batchPredict() {
        console.log('[ChurnPrediction] Starting batch prediction...');

        const now = new Date();
        const activeOrders = await prisma.order.findMany({
            where: {
                warrantyDays: { not: null },
                status: 'COMPLETED',
                initialCount: { not: null },
                createdAt: {
                    gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
                }
            },
            select: { id: true }
        });

        console.log(`[ChurnPrediction] Found ${activeOrders.length} orders to predict`);

        let predicted = 0;
        let skipped = 0;
        let errors = 0;

        for (const order of activeOrders) {
            try {
                const prediction = await this.generatePrediction(order.id);
                if (prediction) {
                    predicted++;
                } else {
                    skipped++;
                }
            } catch (error) {
                console.error(`[ChurnPrediction] Error predicting order ${order.id}:`, error);
                errors++;
            }
        }

        console.log(`[ChurnPrediction] Batch complete: ${predicted} predicted, ${skipped} skipped, ${errors} errors`);

        return { predicted, skipped, errors, total: activeOrders.length };
    }

    /**
     * Notify user about churn risk
     * TODO: Integrate with Telegram bot and email service
     */
    private static async notifyUserChurnRisk(
        userId: string,
        orderId: number,
        predictedChurnPercent: number
    ) {
        console.log(`[ChurnPrediction] 🚨 ALERT: User ${userId} has high churn risk on order ${orderId} (${predictedChurnPercent.toFixed(1)}%)`);

        // TODO: Implement actual notifications
        // 1. Telegram Bot notification
        // 2. Email notification
        // 3. Dashboard badge/banner

        // For now, just log and create a notification record
        // In production, this would call TelegramService.sendMessage() and EmailService.send()

        try {
            // Example: Telegram notification (to be implemented)
            // await TelegramService.sendMessage(user.tgId, {
            //   text: `⚠️ Внимание! У вас снижается количество подписчиков на заказе ${orderId}.\n\n` +
            //     `Прогнозируемый отток: ${predictedChurnPercent.toFixed(1)}%\n` +
            //     `Рекомендуем докупить сейчас, пока действует гарантия!`,
            //   reply_markup: {
            //     inline_keyboard: [[
            //       { text: '🔄 Докупить сейчас', callback_data: `refill:${orderId}` }
            //     ]]
            //   }
            // });

            console.log(`[ChurnPrediction] Notification queued for user ${userId}`);
        } catch (error) {
            console.error(`[ChurnPrediction] Failed to send notification:`, error);
        }
    }

    /**
     * Get at-risk orders (REFILL_NOW recommended)
     * For admin dashboard
     */
    static async getAtRiskOrders(limit: number = 50) {
        const predictions = await prisma.churnPrediction.findMany({
            where: {
                recommendedAction: 'REFILL_NOW',
                createdAt: {
                    // Only recent predictions (last 48 hours)
                    gte: new Date(Date.now() - 48 * 60 * 60 * 1000)
                }
            },
            include: {
                order: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                tgId: true
                            }
                        },
                        internalService: {
                            select: {
                                name: true,
                                platform: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                predictedChurn: 'desc'
            },
            take: limit
        });

        return predictions;
    }

    /**
     * Calculate refill quantity recommendation
     * Based on predicted churn and warranty remaining
     */
    static calculateRefillQuantity(
        initialCount: number,
        currentCount: number,
        predictedChurnPercent: number,
        daysRemaining: number
    ): number {
        // Calculate expected loss over remaining warranty period
        const dailyChurnRate = predictedChurnPercent / 700; // Predicted over 7 days, convert to daily
        const expectedLoss = Math.ceil(currentCount * dailyChurnRate * daysRemaining);

        // Add 10% buffer for safety
        const recommendedRefill = Math.ceil(expectedLoss * 1.1);

        return Math.max(recommendedRefill, 0);
    }

    /**
     * ML Model Training (Future Enhancement)
     * 
     * Features to use:
     * - warrantyDays
     * - serviceType (platform + category)
     * - initialOrderSize
     * - historicalChurnRate (avg dropoff for this service)
     * - seasonality (day of week, month)
     * - userSegment (new/returning)
     * 
     * Algorithm: LightGBM or Random Forest
     * Target: 7-day churn rate (%)
     * 
     * Training data: Export from ChurnSnapshot table
     */
    static async exportTrainingData() {
        // Export all snapshots for ML training
        const snapshots = await prisma.churnSnapshot.findMany({
            include: {
                order: {
                    include: {
                        internalService: {
                            select: {
                                platform: true,
                                category: true,
                                guaranteeDays: true
                            }
                        }
                    }
                }
            },
            take: 10000 // Last 10k snapshots
        });

        // Format for CSV export
        const csvData = snapshots.map(s => ({
            orderId: s.orderId,
            daysElapsed: s.daysElapsed,
            subscriberCount: s.subscriberCount,
            dropoffRate: Number(s.dropoffRate),
            platform: s.order.internalService.platform,
            category: s.order.internalService.category,
            warrantyDays: s.order.warrantyDays,
            initialCount: s.order.initialCount,
            snapshotDate: s.snapshotDate.toISOString()
        }));

        console.log(`[ChurnPrediction] Exported ${csvData.length} training samples`);

        return csvData;
    }
}

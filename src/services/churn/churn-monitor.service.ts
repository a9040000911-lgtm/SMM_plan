/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { ManagedChannelService } from '../vip/managed-channel.service';

/**
 * Churn Monitoring Service (Phase 11)
 * Tracks subscriber counts for orders with warranty periods
 * Creates snapshots for historical analysis and churn prediction
 */

export class ChurnMonitorService {
    /**
     * Cron job: runs every 6 hours
     * Fetches current subscriber counts for all active orders with warranty
     */
    static async updateSubscriberCounts() {
        console.log('[ChurnMonitor] Starting subscriber count update...');

        // Find all orders with warranty that are still within warranty period
        const now = new Date();
        const activeOrders = await prisma.order.findMany({
            where: {
                warrantyDays: { not: null },
                status: 'COMPLETED',
                initialCount: { not: null },
                createdAt: {
                    // Only check orders within their warranty period
                    gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) // Max 365 days back
                }
            },
            include: {
                managedChannel: true
            }
        });

        console.log(`[ChurnMonitor] Found ${activeOrders.length} orders to monitor`);

        let updated = 0;
        let errors = 0;

        for (const order of activeOrders) {
            try {
                // Check if order is still within warranty
                const daysSinceCreation = Math.floor(
                    (now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24)
                );

                if (daysSinceCreation > (order.warrantyDays || 0)) {
                    console.log(`[ChurnMonitor] Order ${order.id} is past warranty (${daysSinceCreation}/${order.warrantyDays} days)`);
                    continue;
                }

                // Fetch current subscriber count
                const currentCount = await this.fetchCurrentCount(order);

                // Update order
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        currentCount,
                        lastCheckedAt: now
                    }
                });

                // Create snapshot
                await this.createSnapshot(order.id, currentCount, daysSinceCreation);

                updated++;
            } catch (error) {
                console.error(`[ChurnMonitor] Error updating order ${order.id}:`, error);
                errors++;
            }
        }

        console.log(`[ChurnMonitor] Update complete: ${updated} updated, ${errors} errors`);

        return { updated, errors, total: activeOrders.length };
    }

    /**
     * Create a snapshot for an order
     */
    private static async createSnapshot(
        orderId: number,
        subscriberCount: number,
        daysElapsed: number
    ) {
        // Get the most recent snapshot to calculate dropoff rate
        const previousSnapshot = await prisma.churnSnapshot.findFirst({
            where: { orderId },
            orderBy: { snapshotDate: 'desc' }
        });

        let dropoffRate = 0;
        let isSuspicious = false;

        if (previousSnapshot && previousSnapshot.subscriberCount > 0) {
            dropoffRate = ((previousSnapshot.subscriberCount - subscriberCount) / previousSnapshot.subscriberCount) * 100;

            // Если отток > 50% за один шаг мониторинга (6 часов) — это подозрительно (ошибка API или бан)
            if (dropoffRate > 50 || subscriberCount === 0) {
                console.warn(`[ChurnMonitor] SUSPICIOUS DATA detected for order ${orderId}: ${subscriberCount} subs (Drop: ${dropoffRate.toFixed(2)}%)`);
                isSuspicious = true;
            }
        }

        await prisma.churnSnapshot.create({
            data: {
                orderId,
                subscriberCount,
                daysElapsed,
                dropoffRate,
                // Мы добавим поле isSuspicious в метаданные, пока нет в схеме напрямую
                metadata: { isSuspicious } as any
            }
        });

        console.log(`[ChurnMonitor] Snapshot created for order ${orderId}: ${subscriberCount} subs, ${dropoffRate.toFixed(2)}% dropoff${isSuspicious ? ' [SUSPICIOUS]' : ''}`);
    }

    /**
     * Fetch actual subscriber count from external API or link analysis
     * 
     * TODO: Integrate with platform-specific APIs:
     * - Instagram: Instagram Graph API
     * - VK: VK API
     * - Telegram: Telegram Bot API (channel stats)
     * - YouTube: YouTube Data API
     * - TikTok: TikTok Business API
     * 
     * For MVP: Returns mock data or scrapes if API unavailable
     */
    private static async fetchCurrentCount(order: any): Promise<number> {
        // --- PHASE 12: VIP GUARDIAN (High-Accuracy) ---
        // Если бот добавлен в канал/группу администратором, используем прямой запрос к Telegram
        if (order.managedChannelId && order.managedChannel?.isActive) {
            const chatId = order.managedChannel.chatId;
            const exactCount = await ManagedChannelService.getExactMemberCount(chatId);

            if (exactCount > 0) {
                console.log(`[ChurnMonitor] VIP Guardian: Accurate count for ${order.id} via Bot API -> ${exactCount}`);
                return exactCount;
            }
            console.warn(`[ChurnMonitor] Bot API returned 0 or error for managed channel ${chatId}. Falling back to external API.`);
        }

        // --- FALLBACK: External API or Link Analysis ---
        // TODO: Implement real API integration

        // For now, simulate realistic churn patterns
        // In production, this would call platform-specific APIs

        // Mock: Simulate 1-5% daily churn rate
        const mockChurnRate = 0.01 + Math.random() * 0.04; // 1-5%
        const baseCount = order.initialCount || 1000;
        const randomVariation = Math.floor(baseCount * (1 - (mockChurnRate * (Math.random() * 5)))); // More variation

        console.log(`[ChurnMonitor] Mock: Fetched count for ${order.link} -> ${randomVariation}`);

        return randomVariation;
    }

    /**
     * Initialize warranty tracking for a new order
     * Called when an order is completed
     */
    static async initializeOrderTracking(orderId: number, initialCount: number, warrantyDays: number) {
        await prisma.order.update({
            where: { id: orderId },
            data: {
                initialCount,
                currentCount: initialCount,
                warrantyDays,
                lastCheckedAt: new Date()
            }
        });

        // Create initial snapshot
        await this.createSnapshot(orderId, initialCount, 0);

        console.log(`[ChurnMonitor] Initialized tracking for order ${orderId}: ${initialCount} subs, ${warrantyDays} days warranty`);
    }

    /**
     * Get churn statistics for an order
     */
    static async getOrderChurnStats(orderId: number) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                churnSnapshots: {
                    orderBy: { snapshotDate: 'desc' },
                    take: 30 // Last 30 snapshots
                },
                churnPredictions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!order) return null;

        const totalDropoff = order.initialCount && order.currentCount
            ? ((order.initialCount - order.currentCount) / order.initialCount) * 100
            : 0;

        const daysInWarranty = order.warrantyDays
            ? Math.floor((Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        const daysRemaining = order.warrantyDays
            ? Math.max(0, order.warrantyDays - daysInWarranty)
            : 0;

        return {
            orderId: order.id,
            initialCount: order.initialCount,
            currentCount: order.currentCount,
            totalDropoff,
            warrantyDays: order.warrantyDays,
            daysInWarranty,
            daysRemaining,
            snapshots: order.churnSnapshots,
            latestPrediction: order.churnPredictions[0] || null
        };
    }
}

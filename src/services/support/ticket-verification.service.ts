/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';

/**
 * Service для автоматической верификации support tickets
 * Связывает тикеты с реальными пользователями через Order ID или email
 */
export class TicketVerificationService {
    /**
     * Автоматически верифицирует тикет на основе контекста
     * @returns {verified: boolean, userId?: string, method?: string}
     */
    static async autoVerify(ticketId: string): Promise<{
        verified: boolean;
        userId?: string;
        method?: string;
    }> {
        const ticket = await prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                messages: { orderBy: { createdAt: 'asc' } },
                user: true
            }
        });

        if (!ticket || ticket.isVerified) {
            return { verified: ticket?.isVerified || false };
        }

        // 1️⃣ Попытка извлечь Order ID из первого сообщения
        const firstMessage = ticket.messages[0]?.text || ticket.subject || '';
        const orderMatch = this.extractOrderId(firstMessage);

        if (orderMatch) {
            const isNumeric = /^\d+$/.test(orderMatch);
            const orderIdInt = isNumeric ? parseInt(orderMatch) : null;

            const order = await prisma.order.findFirst({
                where: {
                    OR: [
                        orderIdInt ? { id: orderIdInt } : undefined,
                        // If it's not a direct numeric match, it might be a partial external ID match (though Order.id is Int)
                        // Actually, if someone searches by external ID, it should be a string search.
                        // But here we are matching against Order.id.
                    ].filter(Boolean) as any
                }
            });

            if (order) {
                await prisma.supportTicket.update({
                    where: { id: ticketId },
                    data: {
                        verifiedUserId: order.userId,
                        orderId: order.id,
                        isVerified: true
                    }
                });

                console.log(`✅ Ticket ${ticketId} verified via Order ID: ${order.id}`);
                return { verified: true, userId: order.userId, method: 'order_id' };
            }
        }

        // 2️⃣ Если user имеет email - используем его для поиска Orders
        if (ticket.user.email) {
            const ordersWithEmail = await prisma.order.count({
                where: {
                    user: {
                        email: ticket.user.email
                    }
                }
            });

            await prisma.supportTicket.update({
                where: { id: ticketId },
                data: {
                    verifiedEmail: ticket.user.email,
                    verifiedUserId: ticket.user.id,
                    isVerified: true
                }
            });

            console.log(`✅ Ticket ${ticketId} verified via EMAIL: ${ticket.user.email} (${ordersWithEmail} orders found)`);
            return { verified: true, userId: ticket.user.id, method: 'email' };
        }

        // 3️⃣ Если пользователь из TG и имеет заказы - автоматически верифицируем
        if (ticket.user.tgId) {
            const userOrdersCount = await prisma.order.count({
                where: { userId: ticket.user.id }
            });

            if (userOrdersCount > 0) {
                await prisma.supportTicket.update({
                    where: { id: ticketId },
                    data: {
                        verifiedUserId: ticket.user.id,
                        isVerified: true
                    }
                });

                console.log(`✅ Ticket ${ticketId} verified via TG user with ${userOrdersCount} orders`);
                return { verified: true, userId: ticket.user.id, method: 'tg_with_orders' };
            }
        }

        console.log(`⚠️ Ticket ${ticketId} could not be auto-verified`);
        return { verified: false };
    }

    /**
     * Извлекает Order ID из текста
     * Поддерживает форматы: #ORDER-ABC123, #ABC123, "заказ ABC123", "order ABC123"
     */
    private static extractOrderId(text: string): string | null {
        const patterns = [
            /#ORDER-([A-Z0-9-]+)/i,           // #ORDER-ABC-123
            /#([0-9]{1,10})\b/i,               // #12345 (Numeric Order ID)
            /#([A-Z0-9]{6,})/i,                // #ABC123DEF (Legacy/Partial)
            /заказ[:\s#]+([0-9A-Z-]+)/i,      // заказ: 123
            /order[:\s#]+([0-9A-Z-]+)/i,      // order: 123
            /\bORDER-([0-9A-Z-]+)\b/i         // ORDER-123
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const candidate = match[1];
                // If it's purely numeric, we accept it even if short
                if (/^\d+$/.test(candidate)) return candidate;

                // If contains letters, require at least 6 chars (for safety)
                if (candidate.length >= 6 || /[A-Z]/.test(candidate)) {
                    return candidate;
                }
            }
        }

        return null;
    }

    /**
     * Вручную верифицирует тикет на конкретного пользователя (admin action)
     */
    static async manualVerify(
        ticketId: string,
        verifiedUserId: string,
        orderId?: number
    ): Promise<void> {
        await prisma.supportTicket.update({
            where: { id: ticketId },
            data: {
                verifiedUserId,
                orderId,
                isVerified: true
            }
        });

        console.log(`✅ Ticket ${ticketId} manually verified to user ${verifiedUserId}`);
    }

    /**
     * Получает полный контекст пользователя для тикета (для админ-панели)
     */
    static async getUserContext(ticketId: string) {
        const ticket = await prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                user: true,
                verifiedUser: {
                    include: {
                        orders: {
                            orderBy: { createdAt: 'desc' },
                            take: 10,
                            include: {
                                internalService: true
                            }
                        },
                        transactions: {
                            orderBy: { createdAt: 'desc' },
                            take: 5
                        }
                    }
                },
                order: {
                    include: {
                        internalService: true,
                        user: true
                    }
                }
            }
        });

        if (!ticket) return null;

        // Если есть verifiedUser - показываем его историю
        const contextUser = ticket.verifiedUser || ticket.user;

        return {
            ticket,
            user: contextUser,
            isVerified: ticket.isVerified,
            verificationMethod: ticket.orderId ? 'order_id' : ticket.verifiedEmail ? 'email' : 'manual',
            relatedOrder: ticket.order
        };
    }
}

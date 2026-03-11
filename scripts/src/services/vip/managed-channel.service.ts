/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { bot } from '@/lib/bot';

export class ManagedChannelService {
    /**
     * Пытается привязать канал к пользователю.
     * Проверяет, является ли бот администратором.
     */
    static async registerChannel(userId: string, projectId: string, chatIdentifier: string | number, requesterTgId?: number) {
        try {
            const chat = await bot.telegram.getChat(chatIdentifier);

            // Проверяем тип чата (канал или группа)
            if (chat.type !== 'channel' && chat.type !== 'supergroup') {
                throw new Error('Указанный чат не является каналом или супергруппой');
            }

            // Проверяем статус бота
            const botInfo = await bot.telegram.getMe();
            const botMember = await bot.telegram.getChatMember(chat.id, botInfo.id);
            const isModerator = ['administrator', 'creator'].includes(botMember.status);

            if (!isModerator) {
                throw new Error('Бот должен быть администратором канала (с доступом к информации о канале)');
            }

            // Дополнительная проверка на права пользователя, если предоставлен requesterTgId
            if (requesterTgId) {
                try {
                    const userMember = await bot.telegram.getChatMember(chat.id, requesterTgId);
                    if (!['administrator', 'creator'].includes(userMember.status)) {
                        throw new Error('Вы должны быть администратором этого канала для его регистрации');
                    }
                } catch (_e) {
                    throw new Error('Не удалось подтвердить ваши права администратора в этом канале');
                }
            }

            return await prisma.managedChannel.upsert({
                where: { chatId: BigInt(chat.id) },
                update: {
                    isActive: true,
                    title: (chat as any).title || undefined,
                    username: (chat as any).username || undefined,
                    updatedAt: new Date()
                },
                create: {
                    projectId,
                    userId,
                    chatId: BigInt(chat.id),
                    title: (chat as any).title || undefined,
                    username: (chat as any).username || undefined,
                    isActive: true
                }
            });
        } catch (error: any) {
            console.error('[ManagedChannel] Registration failed:', error.message);
            throw error;
        }
    }

    /**
     * Получает актуальное количество участников напрямую из Telegram.
     * Используется вместо внешних API для 100% точности.
     */
    static async getExactMemberCount(chatId: bigint | number): Promise<number> {
        try {
            return await bot.telegram.getChatMembersCount(Number(chatId));
        } catch (err) {
            console.error(`[ManagedChannel] Failed to fetch member count for ${chatId}:`, err);
            return 0;
        }
    }

    /**
     * Пытается автоматически связать новый заказ с уже зарегистрированным каналом.
     * Если связь найдена, мониторинг будет использовать Bot API.
     */
    static async linkOrderToChannel(orderId: number, link: string, projectId: string | null, tx?: any) {
        const db = tx || prisma;
        // Упрощенный парсинг юзернейма
        let username = link;
        if (link.includes('t.me/')) {
            username = link.split('t.me/')[1]?.split(/[/?]/)[0];
        } else if (link.startsWith('@')) {
            username = link.substring(1);
        }

        if (!username) return;

        const channel = await db.managedChannel.findFirst({
            where: {
                OR: [
                    { username: username },
                    { username: { endsWith: username } }
                ],
                projectId: projectId || undefined,
                isActive: true
            }
        });

        if (channel) {
            await db.order.update({
                where: { id: orderId },
                data: { managedChannelId: channel.id }
            });
            console.log(`[ManagedChannel] Order ${orderId} linked to managed channel ${channel.username || channel.chatId}`);
            return true;
        }
        return false;
    }
}

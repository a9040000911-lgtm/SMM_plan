'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { ConfigService } from '@/lib/config.service';

export async function getSupportAiSuggestionAction(ticketId: string) {
    try {
        const config = await ConfigService.getAiConfig();
        if (!config.apiKey) throw new Error('AI API Key not configured');

        // 1. Fetch ticket, context (messages), and user orders
        const ticketRaw = await prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                user: {
                    select: {
                        id: true,
                        username: true,
                        balance: true,
                        createdAt: true,
                        orders: {
                            orderBy: { createdAt: 'desc' },
                            take: 5,
                            select: {
                                id: true,
                                status: true,
                                totalPrice: true,
                                createdAt: true,
                                link: true,
                                internalService: { select: { name: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!ticketRaw) throw new Error('Ticket not found');

        const genAI = new GoogleGenerativeAI(config.apiKey);
        
        // Proxy support
        let requestOptions: any = {};
        if (config.proxy) {
            try {
                const { ProxyAgent } = await import('undici');
                const dispatcher = new ProxyAgent(config.proxy.startsWith('http') ? config.proxy : `http://${config.proxy}`);
                requestOptions.fetchFn = (url: string, options: any) => fetch(url, { ...options, dispatcher } as any);
            } catch (e) {
                console.warn('[SupportAI] ProxyAgent not available, using default fetch');
            }
        }

        const model = genAI.getGenerativeModel({ model: config.model }, requestOptions);

        const prompt = `
Ты — продвинутый ассистент техподдержки SMM-панели.
Проанализируй проблему клиента и предложи наиболее вероятный и полезный ответ для администратора.

КЛИЕНТ: ${ticketRaw.user.username}
БАЛАНС: ${ticketRaw.user.balance}₽
ПОСЛЕДНИЕ ЗАКАЗЫ:
${ticketRaw.user.orders.map(o => `- ID ${o.id}: ${o.internalService.name}, Статус: ${o.status}, Ссылка: ${o.link}`).join('\n')}

ИСТОРИЯ ПЕРЕПИСКИ (последние 10 сообщений):
${ticketRaw.messages.reverse().map(m => `[${m.sender}] ${m.text}`).join('\n')}

ИНСТРУКЦИИ:
1. Будь вежливым, профессиональным, но лаконичным.
2. Если клиент спрашивает почему заказ отменен — объясни, что деньги вернулись на баланс автоматически.
3. Если задержка — предложи набраться терпения или проверь формат ссылки.
4. Отвечай В ТОЧНОСТИ тем текстом, который администратор должен отправить клиенту. Без вступлений типа "Вот ответ:".
`;

        const result = await model.generateContent(prompt);
        return { success: true, suggestion: result.response.text().trim() };
    } catch (e: any) {
        console.error('[SupportAI] Suggestion error:', e);
        return { success: false, error: e.message };
    }
}

'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@/lib/config.service';
import { getAdminSession } from '@/utils/admin-session';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

async function getCtx(): Promise<AdminContext> {
    const session = await getAdminSession();
    if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) throw new Error('Unauthorized');
    return {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };
}

export async function getSupportAiSuggestionAction(ticketId: string) {
    try {
        const ctx = await getCtx();
        const config = await ConfigService.getAiConfig();
        if (!config.apiKey) throw new Error('AI API Key not configured');

        const result = await AdminDataService.getSupportAiContext(ctx, ticketId);
        if (!result.success) throw new Error(result.error.message);
        
        const ticketRaw = result.data;

        const genAI = new GoogleGenerativeAI(config.apiKey);
        
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
${ticketRaw.user.orders.map((o: any) => `- ID ${o.id}: ${o.internalService.name}, Статус: ${o.status}, Ссылка: ${o.link}`).join('\n')}

ИСТОРИЯ ПЕРЕПИСКИ (последние 10 сообщений):
${ticketRaw.messages.reverse().map((m: any) => `[${m.sender}] ${m.text}`).join('\n')}

ИНСТРУКЦИИ:
1. Будь вежливым, профессиональным, но лаконичным.
2. Если клиент спрашивает почему заказ отменен — объясни, что деньги вернулись на баланс автоматически.
3. Если задержка — предложи набраться терпения или проверь формат ссылки.
4. Отвечай В ТОЧНОСТИ тем текстом, который администратор должен отправить клиенту. Без вступлений типа "Вот ответ:".
`;

        const aiResult = await model.generateContent(prompt);
        return { success: true, suggestion: aiResult.response.text().trim() };
    } catch (e: any) {
        console.error('[SupportAI] Suggestion error:', e);
        return { success: false, error: e.message };
    }
}

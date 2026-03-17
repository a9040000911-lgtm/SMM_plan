/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DescriptionSanitizer } from '@/utils/description-sanitizer';
import { ConfigService } from '@/lib/config.service';

export class DescriptionGeneratorService {
    /**
     * Enhances a service description using Gemini.
     */
    static async enhanceDescription(params: {
        name: string;
        currentDescription?: string;
        providerDescription?: string;
    }) {
        const config = await ConfigService.getAiConfig();
        if (!config.apiKey) return params.currentDescription || '';

        const name = DescriptionSanitizer.sanitize(params.name);
        const currentDescription = DescriptionSanitizer.sanitize(params.currentDescription || '');
        const providerDescription = DescriptionSanitizer.sanitize(params.providerDescription || '');

        const prompt = `
Ты — опытный копирайтер для SMM-панели "SMMPlan". 
Твоя задача: Составить привлекательное и структурированное описание для услуги на основе предоставленных данных.

НАЗВАНИЕ УСЛУГИ: ${name}

ОРИГИНАЛЬНОЕ ОПИСАНИЕ ОТ ПРОВАЙДЕРА (технические детали):
${providerDescription || 'Нет данных'}

ТЕКУЩЕЕ ОПИСАНИЕ В СИСТЕМЕ (может содержать важные технические инструкции):
${currentDescription || 'Нет данных'}

ИНСТРУКЦИИ:
1. ИСПОЛЬЗУЙ данные провайдера для точности (скорость, гарантия, качество).
2. НЕ ВРИ: если провайдер пишет "без гарантии", не пиши "есть гарантия".
3. ЗАЩИТА: Если в текущем описании есть ссылки на ботов, предупреждения "обязательно открытый профиль" или специфические правила сервиса — ОСТАВЬ ИХ БЕЗ ИЗМЕНЕНИЙ в тексте.
4. Используй Markdown для оформления (жирный текст, через список - например: Старт: ..., Качество: ..., Скорость: ...).
5. Сделай текст привлекательным для покупателя, подчеркни выгоды, но будь честным.
6. Отвечай ТОЛЬКО готовым текстом описания на русском языке.
`;

        try {
            const genAI = new GoogleGenerativeAI(config.apiKey);
            
            // Proxy support
            const requestOptions: any = {};
            if (config.proxy) {
                try {
                    const { ProxyAgent } = await import('undici');
                    const dispatcher = new ProxyAgent(config.proxy.startsWith('http') ? config.proxy : `http://${config.proxy}`);
                    requestOptions.fetchFn = (url: string, options: any) => fetch(url, { ...options, dispatcher } as any);
                } catch (e) {
                    console.warn('[Gemini] ProxyAgent not available, using default fetch');
                }
            }

            const model = genAI.getGenerativeModel({ model: config.model }, requestOptions);
            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        } catch (e) {
            console.error('[Gemini] Error enhancing description:', e);
            return currentDescription;
        }
    }
}

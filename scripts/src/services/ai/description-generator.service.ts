/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DescriptionSanitizer } from '@/utils/description-sanitizer';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class DescriptionGeneratorService {
    /**
     * Enhances a service description using Gemini.
     * Logic: Uses provider info, protects "important" parts, makes it attractive.
     */
    static async enhanceDescription(params: {
        name: string;
        currentDescription?: string;
        providerDescription?: string;
    }) {
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

ПРАВИЛА:
1. ИСПОЛЬЗУЙ данные провайдера для точности (скорость, гарантия, качество).
2. НЕ ВРИ. Если провайдер пишет "без гарантии", не пиши "стабильно навсегда".
3. ЗАЩИТА ВАЖНОГО: Если в текущем описании есть ссылки на ботов (например, @sub_checker_ro_bot), технические предупреждения (обязательно открытый профиль) или специфические правила сервиса — ОСТАВЬ ИХ БЕЗ ИЗМЕНЕНИЙ в тексте.
4. СТИЛЬ: Используй Markdown. Структурируй через список (например: 🚀 Старт, ✨ Качество, ⏳ Скорость). 
5. Сделай текст "вкусным" для покупателя, подчеркни выгоды, но будь честным.
6. Отвечай ТОЛЬКО готовым текстом описания на русском языке.

Текст описания:
`;

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error('Gemini Enhance Description Error:', error);
            throw error;
        }
    }
}

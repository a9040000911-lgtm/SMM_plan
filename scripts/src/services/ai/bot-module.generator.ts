/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export type BotModuleType = 'WELCOME' | 'MARKETING' | 'INFO' | 'AWARENESS' | 'INTEREST' | 'DESIRE' | 'ACTION';
export type Tone = 'PROFESSIONAL' | 'FRIENDLY' | 'AGGRESSIVE' | 'MINIMALIST';

export interface BotModule {
    id: string;
    type: BotModuleType;
    content: string; // HTML supported
    isEnabled: boolean;
    order: number;
    tone?: Tone;
}

// Template Registry
const TEMPLATES: Record<Tone, Record<string, string>> = {
    PROFESSIONAL: {
        AWARENESS: `👋 <b>Здравствуйте! Добро пожаловать в SMMPlan.</b>\n\nВы ищете надежный инструмент для профессионального продвижения? Мы понимаем ценность репутации и времени.`,
        INTEREST: `👔 <b>SMMPlan — выбор бизнеса.</b>\n\nМы предлагаем автоматизированное решение для масштабирования вашего бренда.\n• Точный таргетинг\n• Отчетность\n• Премиум качество`,
        DESIRE: `📊 <b>Факты:</b>\nБолее 300 корпоративных клиентов увеличили охваты на 200% в первый месяц работы с нами. Станьте лидером ниши.`,
        ACTION: `🤝 <b>Специальное предложение</b>\n\nМы активировали для Вас скидку 20% на первый заказ. Начните работу прямо сейчас.`
    },
    FRIENDLY: {
        AWARENESS: `👋 <b>Привет-привет! Рады тебя видеть!</b> 😼\n\nХочешь, чтобы твой профиль наконец-то заметили? Мы знаем, как это сделать легко и весело!`,
        INTEREST: `✨ <b>Смотри, как мы можем помочь:</b>\n\nSMMPlan — это твой личный помощник по лайкам и подпискам.\n✅ Быстро\n✅ Без собачек\n✅ И очень просто!`,
        DESIRE: `💖 <b>Нас выбирают друзья!</b>\nУже 300+ человек прокачали свои аккаунты. Твои подписчики уже ждут тебя. Не заставляй их скучать!`,
        ACTION: `🚀 <b>Погнали?</b>\n\nДержи скидочку 20% на старт! Жми кнопку внизу, и полетели в топ! 🎈`
    },
    AGGRESSIVE: {
        AWARENESS: `🔥 <b>Хватит сидеть без просмотров!</b>\n\nТвои конкуренты уже в топе, а ты? Пора менять правила игры.`,
        INTEREST: `⚡️ <b>SMMPlan — это ракетное топливо.</b>\n\nМы не про "попробовать", мы про <b>ДОМИНИРОВАНИЕ</b>.\n• Мгновенный взлет\n• Жесткие гарантии\n• Результат здесь и сейчас`,
        DESIRE: `🏆 <b>Ты либо первый, либо никто.</b>\n300+ лидеров уже используют наши алгоритмы. Ты с нами или остаешься в тени?`,
        ACTION: `💣 <b>ДЕЙСТВУЙ!</b>\n\nСкидка 20% сгорает. Забирай трафик, пока это не сделали другие!`
    },
    MINIMALIST: {
        AWARENESS: `<b>SMMPlan.</b> Продвижение, которое работает.`,
        INTEREST: `• Быстро.\n• Качественно.\n• Надежно.\nВаш рост — наша задача.`,
        DESIRE: `300+ клиентов. +200% роста.`,
        ACTION: `Скидка 20% активирована. Начать:`
    }
};

export class BotModuleGenerator {
    static async generate(type: BotModuleType, projectContext: string, tone: Tone = 'PROFESSIONAL'): Promise<string> {
        // AI Prompt Construction
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

        // Define specific prompt nuances based on Tone
        let toneInstruction = "Style: Professional, concise, trustworthy.";
        if (tone === 'FRIENDLY') toneInstruction = "Style: Friendly, casual, use emojis, address user as 'friend'.";
        if (tone === 'AGGRESSIVE') toneInstruction = "Style: Energetic, assertive, FOMO-inducing, use fire emojis, short sentences.";
        if (tone === 'MINIMALIST') toneInstruction = "Style: Extremely concise, only facts, no fluff.";

        let taskInstruction = "";
        switch (type) {
            case 'AWARENESS': taskInstruction = `Write "Awareness" stage message. Identify user pain point (low views/subs). Hook them.`; break;
            case 'INTEREST': taskInstruction = `Write "Interest" stage message. Pitch SMMPlan solution. List 3 bullets benefits.`; break;
            case 'DESIRE': taskInstruction = `Write "Desire" stage message. Use social proof (300+ users). Mention "Pioneer" status.`; break;
            case 'ACTION': taskInstruction = `Write "Action" stage message. Call to Action with "20% Discount".`; break;
            default: taskInstruction = `Write a message for context: ${type}`; break;
        }

        const prompt = `
            Role: Expert Copywriter.
            Context: ${projectContext}
            Tone: ${toneInstruction}
            Task: ${taskInstruction}
            Format: HTML (<b>, <i>).
            Output ONLY the text.
        `;

        try {
            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        } catch (e) {
            console.error(`AI Error (${tone}):`, e);
            // Enhanced Fallback based on Tone/Template Registry
            const template = TEMPLATES[tone] || TEMPLATES['PROFESSIONAL'];
            // Access by type name, fallback to generic if key missing (though all defined)
            const fallback = (template as any)[type];
            if (fallback) return fallback;

            return `<b>Информация</b>\nМы поможем вам вырасти.`;
        }
    }

    static async generateFunnel(projectContext: string, tone: Tone = 'PROFESSIONAL'): Promise<BotModule[]> {
        const stages: BotModuleType[] = ['AWARENESS', 'INTEREST', 'DESIRE', 'ACTION'];

        const modules: BotModule[] = [];
        let order = 1;

        for (const stage of stages) {
            const content = await this.generate(stage, projectContext, tone);
            modules.push({
                id: crypto.randomUUID(),
                type: stage,
                content,
                isEnabled: true,
                order: order++,
                tone
            });
        }
        return modules;
    }

    // ... (keep getProjectModules and saveProjectModules)

    static async getProjectModules(projectId: string): Promise<BotModule[]> {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { config: true }
        });

        const config = project?.config as any || {};
        return (config.botModules as BotModule[]) || [];
    }

    static async saveModules(projectId: string, modules: BotModule[]) {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        const config = (project?.config as any) || {};

        await prisma.project.update({
            where: { id: projectId },
            data: {
                config: {
                    ...config,
                    botModules: modules
                }
            }
        });
    }
}

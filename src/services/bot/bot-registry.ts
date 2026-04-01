/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { Telegraf } from 'telegraf';
import { ConfigService } from '@/services/core/config.service';

const systemConfig = ConfigService.getSystemConfig();
const TOKEN = systemConfig?.defaultBotToken;

// Создаем инстанс бота один раз (Singleton)
const globalForBot = global as unknown as {
    bot: Telegraf | null,
    botRegistry: Map<string, Telegraf>
};

if (!globalForBot.botRegistry) {
    globalForBot.botRegistry = new Map();
}

/**
 * Основной инстанс бота.
 * В режиме SKIP_BOT он создается, но НЕ запускается (launch/startPolling).
 * Это нужно для возможности использовать telegram.sendMessage из основного приложения.
 */
export const bot: Telegraf = (globalForBot.bot || new Telegraf(TOKEN || 'dummy_token')) as Telegraf;

/**
 * Реестр запущенных инстансов ботов для разных проектов
 */
export const BotRegistry = {
    register(projectId: string, instance: Telegraf) {
        globalForBot.botRegistry.set(projectId, instance);
    },
    get(projectId?: string | null): Telegraf {
        if (!projectId) return bot;
        return globalForBot.botRegistry.get(projectId) || bot;
    },
    getAll(): Map<string, Telegraf> {
        return globalForBot.botRegistry;
    }
};

if (process.env.NODE_ENV !== 'production') globalForBot.bot = bot;

export default bot;



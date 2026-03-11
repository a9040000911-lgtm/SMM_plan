/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Provider, Category, Platform } from '@/generated/client';

export interface LinkAnalyzerRule {
    providerNames: string[];
    providerUrlFragments: string[];
    matchProvider(provider: Provider): boolean;
}

export class LinkAnalyzerService {
    /**
     * Приводит любую ссылку к базовому "чистому" виду
     * Удаляет трекинговые параметры вроде utm, igsh, и очищает завершающие слэши
     */
    public static normalizeLink(link: string): string {
        if (!link) return link;

        let url = link.trim();

        // Если это явно не ссылка (начинается с @, числа, не имеет точки) — возвращаем как есть
        if (url.startsWith('@') || /^\d+$/.test(url) || !url.includes('.')) {
            return url;
        }

        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        try {
            const urlObj = new URL(url);
            const garbageParams = ['igsh', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source'];
            garbageParams.forEach(p => urlObj.searchParams.delete(p));

            // Удаляем висящий слэш у пути (но не трогаем сам хост если пути нет)
            if (urlObj.pathname.length > 1 && urlObj.pathname.endsWith('/')) {
                urlObj.pathname = urlObj.pathname.slice(0, -1);
            }

            // URL() может добавлять / на конце хоста, поэтому чистим финальную строку безопасно
            let finalStr = urlObj.toString();
            if (finalStr.endsWith('/')) {
                finalStr = finalStr.slice(0, -1);
            }

            return finalStr;
        } catch {
            // Это может быть не URL
            return link.trim();
        }
    }

    /**
     * Адаптирует чистую ссылку под специфические (капризные) форматы конкретного провайдера
     * Основано на базе знаний Provider Link Requirements Skill (v2.0)
     */
    public static formatForProvider(
        link: string,
        platform: Platform | null,
        category: Category | null,
        provider: Provider
    ): string {
        const finalLink = LinkAnalyzerService.normalizeLink(link);

        const provNameStr = (provider.name || '').toLowerCase();
        const provUrlStr = (provider.apiUrl || '').toLowerCase();

        // === ТЕЛЕГРАМ БУСТЫ (КАТЕГОРИЯ: BOOSTS) ===
        if (platform === 'TELEGRAM' && category === 'BOOSTS') {
            try {
                const urlObj = new URL(finalLink);

                // 1. SmmPanelUS / Perfect Panel Rules: требует строго /boost/username
                if (provNameStr.includes('smmpanelus') || provUrlStr.includes('smmpanelus')) {
                    // Трансформируем t.me/username в t.me/boost/username
                    if (!urlObj.pathname.startsWith('/boost/')) {
                        urlObj.pathname = '/boost' + (urlObj.pathname.startsWith('/') ? '' : '/') + urlObj.pathname;
                    }
                    // Убиваем ?boost если был
                    urlObj.searchParams.delete('boost');
                    return urlObj.toString();
                }

                // 2. SocRocket Rules: требует ?boost в параметрах запроса
                if (provNameStr.includes('socrocket') || provUrlStr.includes('soc-rocket') || provNameStr.includes('soc-rocket')) {
                    // Убираем /boost/ из пути если он там есть
                    if (urlObj.pathname.startsWith('/boost/')) {
                        urlObj.pathname = urlObj.pathname.replace(/^\/boost\//, '/');
                    }
                    urlObj.searchParams.set('boost', '');
                    // Убираем знак равно, так как нужно просто ?boost (URL объект обычно ставит =)
                    return urlObj.toString().replace('boost=', 'boost');
                }

                // 3. VexBoost - гибкий, оставляем as is, или приводим к стандарту. 
                // VexBoost понимает оба варианта, чистим до стандарта /boost/ для надежности
                if (provNameStr.includes('vexboost') || provUrlStr.includes('vexboost')) {
                    // Оставим ссылку как дал юзер или нормализованную
                }
            } catch {
                // Fallback если ссылка не валидный URL (например только @username)
            }
        }

        // === ЮТУБ ВИДЕО ТУРБО (BOOSTS/TRENDS) ===
        if (platform === 'YOUTUBE' && category === 'BOOSTS') {
            if (provNameStr.includes('socrocket') || provUrlStr.includes('soc-rocket') || provNameStr.includes('soc-rocket')) {
                try {
                    const ytObj = new URL(finalLink);
                    ytObj.searchParams.set('boost', '');
                    return ytObj.toString().replace('boost=', 'boost');
                } catch { }
            }
        }

        return finalLink;
    }

    /**
     * Анализирует описание сервиса провайдера, извлекая требования наличия сервисного бота.
     * Вызывается на этапе синхронизации/импорта, чтобы сохранить requirements в metadata.
     */
    public static extractBotRequirementsFromDescription(description: string | null): { requiresBot: boolean, botInstruction?: string } {
        if (!description) {
            return { requiresBot: false };
        }

        const text = description.toLowerCase();

        if (text.includes('nowon.tools') || text.includes('onlybots.lol')) {
            return {
                requiresBot: true,
                botInstruction: 'Внимание: Для старта работы необходимо добавить нашего системного бота авторизации (nowon.tools / onlybots.lol) на ваш Discord сервер.'
            };
        }

        // Discord боты-офлайн / online участники (generic)
        if (text.includes('требуется бот') || text.includes('пригласите бота') || text.includes('добавьте бота')) {
            return {
                requiresBot: true,
                botInstruction: 'Внимание: Для старта работы необходимо пригласить сервисного бота (согласно описанию услуги) на ваш сервер/канал.'
            };
        }

        return { requiresBot: false };
    }

}

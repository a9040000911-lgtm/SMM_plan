import { IntelligenceLinkAnalyzer, IntelligenceAnalysisResult } from './analyzer/link-analyzer.service';
import { IntelligenceServiceMapper, IntelligenceMappingResult } from './mapper/service-mapper';
import { IntelligencePlatform } from './common/entities';

export class IntelligenceEngine {
    private static analyzer = new IntelligenceLinkAnalyzer();
    private static mapper = new IntelligenceServiceMapper();

    /**
     * Основной метод для глубокого анализа ссылки.
     */
    static async analyzeLink(url: string): Promise<IntelligenceAnalysisResult> {
        return this.analyzer.analyze(url);
    }

    /**
     * Маппинг услуги провайдера.
     */
    static mapService(platform: IntelligencePlatform, name: string, description?: string): IntelligenceMappingResult {
        return this.mapper.map(platform, name, description);
    }

    /**
     * Форматирование ссылки под конкретного провайдера (Shadow Version).
     * Здесь реализуется улучшенная логика, которую мы будем сравнивать с Legacy.
     */
    static formatForProvider(analysis: IntelligenceAnalysisResult, providerName: string): string {
        const name = providerName.toLowerCase();
        let formatted = analysis.canonicalUrl;

        // 1. SmmPanelUS (Perfect Panel) - /boost/ logic for Telegram
        if (analysis.platform === IntelligencePlatform.TELEGRAM && (name.includes('smmpanelus') || name.includes('perfect-panel'))) {
            if (analysis.type === 'channel' && !formatted.includes('/boost')) {
                try {
                    const urlObj = new URL(formatted);
                    if (!urlObj.pathname.startsWith('/boost/')) {
                        urlObj.pathname = '/boost' + (urlObj.pathname.startsWith('/') ? '' : '/') + urlObj.pathname;
                    }
                    formatted = urlObj.toString();
                } catch (e) {}
            }
        }

        // 2. SocRocket - ?boost logic
        if (name.includes('socrocket') || name.includes('soc-rocket')) {
            try {
                const urlObj = new URL(formatted);
                if (urlObj.pathname.startsWith('/boost/')) {
                    urlObj.pathname = urlObj.pathname.replace(/^\/boost\//, '/');
                }
                urlObj.searchParams.set('boost', '');
                formatted = urlObj.toString().replace('boost=', 'boost');
            } catch (e) {}
        }

        return formatted;
    }

    /**
     * Анализирует описание сервиса провайдера, извлекая требования наличия сервисного бота.
     * Вызывается на этапе синхронизации/импорта.
     */
    static extractBotRequirements(description: string | null): { requiresBot: boolean, botInstruction?: string } {
        if (!description) return { requiresBot: false };
        const text = description.toLowerCase();

        if (text.includes('nowon.tools') || text.includes('onlybots.lol')) {
            return {
                requiresBot: true,
                botInstruction: 'Внимание: Для старта работы необходимо добавить нашего системного бота авторизации (nowon.tools / onlybots.lol) на ваш Discord сервер.'
            };
        }

        if (text.includes('требуется бот') || text.includes('пригласите бота') || text.includes('добавьте бота')) {
            return {
                requiresBot: true,
                botInstruction: 'Внимание: Для старта работы необходимо пригласить сервисного бота (согласно описанию услуги) на ваш сервер/канал.'
            };
        }

        return { requiresBot: false };
    }
}

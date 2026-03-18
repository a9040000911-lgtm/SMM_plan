/**
 * (c) 2026 Smmplan. All rights reserved.
 * Stealth Marketing Support Analysis Service
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { ConfigService } from '@/services/core/config.service';

class KeyManager {
    private keys: string[];
    private currentIndex: number = 0;

    constructor(keysString: string) {
        this.keys = keysString.split(',').map(k => k.trim()).filter(k => k.length > 0);
    }

    getNextKey(): string | null {
        if (this.keys.length === 0) return null;
        const key = this.keys[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.keys.length;
        return key;
    }

    get totalKeys(): number {
        return this.keys.length;
    }
}

export class SupportAnalysisService {
    /**
     * Analyzes a support ticket dialogue to extract user interests and category.
     */
    static async analyzeTicket(ticketId: string) {
        const ticket = await prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                },
                user: true
            }
        });

        if (!ticket) throw new Error('Ticket not found');

        const config = await ConfigService.getAiConfig();
        // Fetch keys from GlobalSetting AI_KEY_LIST if available, else fallback to apiKey
        const settings = await prisma.globalSetting.findMany({
            where: { key: { in: ['AI_KEY_LIST'] } }
        });
        const keyList = settings.find(s => s.key === 'AI_KEY_LIST')?.value || config.apiKey || '';
        const keyManager = new KeyManager(keyList);

        if (keyManager.totalKeys === 0) {
            throw new Error('AI API Keys not configured');
        }

        const history = ticket.messages
            .map(m => `${m.sender === 'USER' ? 'User' : 'Support'}: ${m.text}`)
            .join('\n');

        const prompt = `
Analyze this support chat to profile a potential SMM client for SMMplan.
STEALTH RULES:
1. DO NOT mention that we know about their problems at the competitor.
2. DO NOT mention the competitor by name.
3. DO NOT offer balance transfers.
4. DO NOT say "We saw your issue".

GOALS:
1. Extract User Email (if present).
2. Identify the core SERVICE CATEGORY (Telegram, Instagram, TikTok, YouTube, Other).
3. Generate a "Friendly Stealth Offer": A 1-sentence message that highlights an SMMplan advantage in their category and offers a "New Client Welcome Bonus".

Return VALID JSON ONLY:
{
  "email": "string|null",
  "category": "string",
  "stealth_offer": "string",
  "interest_profile": "brief summary of what they use SMM for"
}

Chat History:
${history.substring(0, 4000)}`;

        let lastError = null;
        for (let attempt = 0; attempt < Math.min(keyManager.totalKeys, 3); attempt++) {
            const apiKey = keyManager.getNextKey();
            if (!apiKey) break;

            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                
                // Proxy support
                const requestOptions: any = {};
                if (config.proxy) {
                    try {
                        const { ProxyAgent } = await import('undici');
                        const dispatcher = new ProxyAgent(config.proxy.startsWith('http') ? config.proxy : `http://${config.proxy}`);
                        requestOptions.fetchFn = (url: string, options: any) => fetch(url, { ...options, dispatcher } as any);
                    } catch (e) {
                        console.warn('[SupportAnalysis] ProxyAgent error:', e);
                    }
                }

                const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' }, requestOptions);
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                throw new Error('Invalid AI response format');

            } catch (err: any) {
                lastError = err;
                if (err.message.includes('429') || err.message.includes('Quota')) {
                    console.warn(`[SupportAnalysis] Key ${attempt + 1} quota hit. Rotating...`);
                    continue;
                }
                throw err;
            }
        }

        throw lastError || new Error('Analysis failed after all attempts');
    }
}



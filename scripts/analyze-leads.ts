import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Advanced Multi-Key Stealth Lead Analyzer
 * (c) 2026 SMMplan
 */

class KeyManager {
    private keys: string[];
    private currentIndex: number = 0;

    constructor(keysString: string | undefined) {
        this.keys = (keysString || '').split(',').map(k => k.trim()).filter(k => k.length > 0);
        if (this.keys.length === 0 && process.env.GEMINI_API_KEY) {
            this.keys = [process.env.GEMINI_API_KEY];
        }
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

async function analyzeLeads() {
    const dialoguesPath = path.join(process.cwd(), 'scripts', 'happydesk_full_dialogues.json');
    const outputPath = path.join(process.cwd(), 'scripts', 'leads_database.json');

    console.log('[INFO] Initializing Stealth AI Analysis (Multi-Key Rotation)...');

    const keyManager = new KeyManager(process.env.GEMINI_API_KEYS);
    if (keyManager.totalKeys === 0) {
        console.error('[ERROR] No GEMINI_API_KEYS or GEMINI_API_KEY found in .env');
        return;
    }

    console.log(`[INFO] Loaded ${keyManager.totalKeys} API keys for rotation.`);

    // Setup Local Proxy (Mihomo/Clash) using Global Dispatcher
    const proxyUrl = 'http://127.0.0.1:7897';
    try {
        const { ProxyAgent, setGlobalDispatcher } = await import('undici');
        const dispatcher = new ProxyAgent(proxyUrl);
        setGlobalDispatcher(dispatcher);
        console.log(`[INFO] Forcing Global Proxy: ${proxyUrl}`);
    } catch (e) {
        console.warn('[WARN] Global ProxyAgent initialization failed');
    }

    if (!fs.existsSync(dialoguesPath)) {
        console.error('[ERROR] Dialogues file not found.');
        return;
    }

    const dialogues = JSON.parse(fs.readFileSync(dialoguesPath, 'utf8'));
    const leads = fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath, 'utf8')) : [];
    const processedIds = new Set(leads.map((l: any) => l.id));

    console.log(`[INFO] ${leads.length} leads already processed. Resuming...`);

    const modelId = 'gemini-2.5-flash';
    console.log(`[INFO] Target Model: ${modelId}`);

    for (let i = 0; i < dialogues.length; i++) {
        const d = dialogues[i];
        if (processedIds.has(d.id)) continue;

        let success = false;
        let retries = 0;
        const maxRetries = keyManager.totalKeys * 2;

        while (!success && retries < maxRetries) {
            const apiKey = keyManager.getNextKey();
            if (!apiKey) break;

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelId });

            console.log(`[AI] Analyzing #${d.id} [${i + 1}/${dialogues.length}] with Key ${retries % keyManager.totalKeys + 1}...`);

            try {
                const history = d.messages.map((m: any) => `${m.side === 'in' ? 'User' : 'Support'}: ${m.text}`).join('\n');
                
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
  "id": ${d.id},
  "email": "string|null",
  "category": "string",
  "stealth_offer": "string",
  "tg": "${d.user?.telegram_username || ''}"
}

Chat History:
${history.substring(0, 2000)}`;

                const result = await model.generateContent(prompt);
                const text = await result.response.text();
                
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    leads.push(parsed);
                    processedIds.add(d.id);
                    fs.writeFileSync(outputPath, JSON.stringify(leads, null, 2));
                    console.log(`  ✅ Success: Category=${parsed.category}`);
                    success = true;
                } else {
                    console.warn(`  ⚠️ No JSON for #${d.id}`);
                    retries++; // Treat as soft failure
                }

            } catch (err: any) {
                if (err.message.includes('429') || err.message.includes('Quota exceeded')) {
                    console.warn(`  ⚠️ Quota hit for Key ${retries % keyManager.totalKeys + 1}. Rotating...`);
                    retries++;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    console.error(`  ❌ Failed #${d.id}:`, err.message);
                    break; // Hard failure
                }
            }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[DONE] Extracted ${leads.length} leads. Full file: scripts/leads_database.json`);
}

analyzeLeads().catch(err => console.error('[FATAL]', err));

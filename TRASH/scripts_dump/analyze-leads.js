const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

/**
 * Self-Sufficient Stealth Lead Analyzer
 * No external imports from SMMplan code to avoid ESM/path issues in Docker.
 */

async function analyzeLeads() {
    const dialoguesPath = path.join(process.cwd(), 'scripts', 'happydesk_full_dialogues.json');
    const outputPath = path.join(process.cwd(), 'scripts', 'leads_database.json');

    console.log('[INFO] Analyzing dialogues with Stealth AI (Self-Sufficient Mode)...');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('[ERROR] GEMINI_API_KEY env var is missing.');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Proxy support from env
    let requestOptions = {};
    const proxy = process.env.AI_PROXY;
    if (proxy) {
        try {
            const { ProxyAgent } = require('undici');
            const proxyUrl = proxy.startsWith('http') ? proxy : `http://${proxy}`;
            console.log(`[INFO] Using Proxy: ${proxyUrl}`);
            const dispatcher = new ProxyAgent(proxyUrl);
            requestOptions.fetchFn = (url, options) => fetch(url, { ...options, dispatcher });
        } catch (e) {
            console.warn('[WARN] ProxyAgent initialization failed.');
        }
    }

    // Default model if not specified in env
    const modelId = process.env.AI_SELECTED_MODEL || 'gemini-3-flash-preview';
    const model = genAI.getGenerativeModel({ model: modelId }, requestOptions);

    if (!fs.existsSync(dialoguesPath)) {
        console.error('[ERROR] Dialogues file not found at:', dialoguesPath);
        return;
    }

    const dialogues = JSON.parse(fs.readFileSync(dialoguesPath, 'utf8'));
    const leads = [];
    
    // Process first 20 for verification
    const limit = 20;
    for (let i = 0; i < Math.min(dialogues.length, limit); i++) {
        const d = dialogues[i];
        console.log(`[AI] Processing #${d.id} [${i + 1}/${limit}]...`);

        try {
            const history = d.messages.map(m => `${m.side === 'in' ? 'User' : 'Support'}: ${m.text}`).join('\n');
            
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
                console.log(`  ✅ Success: Category=${parsed.category}`);
            } else {
                console.warn(`  ⚠️ No JSON for #${d.id}`);
            }

        } catch (err) {
            console.error(`  ❌ Failed #${d.id}:`, err.message);
        }

        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    fs.writeFileSync(outputPath, JSON.stringify(leads, null, 2));
    console.log(`[DONE] Extracted ${leads.length} leads. File: scripts/leads_database.json`);
}

analyzeLeads().catch(err => console.error('[FATAL]', err));

import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * HappyDesk Full History Scraper & Telegram ID Extractor
 * (c) 2026 SMMplan
 */

const BASE_URL = 'https://primelike.happydesk.ru/panel/api';
const AUTH_URL = 'https://primelike.happydesk.ru/panel/api/v2/auth';

async function scrapeHappyDesk() {
    const email = 'support@primelike.ru';
    const password = 'V1i4gz6';

    console.log(`[HappyDesk] Starting comprehensive scrape for ${email}...`);

    try {
        // 1. Auth to get token
        const authResponse = await axios.post(AUTH_URL, {
            email,
            password
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const token = authResponse.data.token;
        if (!token) {
            console.error('[HappyDesk] Failed to get auth token. Response:', authResponse.data);
            return;
        }

        console.log(`[HappyDesk] Auth success. Token: ${token.substring(0, 5)}...`);

        // 2. Fetch dialogues list (Target 1000)
        let allDialogues: any[] = [];
        let page = 1;
        let hasMoreDialogues = true;
        const TARGET_COUNT = 1000;

        while (hasMoreDialogues && allDialogues.length < TARGET_COUNT) {
            console.log(`[HappyDesk] Fetching dialogue list page ${page} (Current total: ${allDialogues.length})...`);
            const response = await axios.get(`${BASE_URL}/chat`, {
                params: {
                    page,
                    perPage: 50,
                    expand: 'tags,last_message,new_messages_count'
                },
                headers: {
                    'x-auth-token': token,
                    'Accept': 'application/json'
                }
            });

            const items = response.data.items || [];
            allDialogues = [...allDialogues, ...items];
            
            if (items.length < 50 || allDialogues.length >= TARGET_COUNT) {
                hasMoreDialogues = false;
            } else {
                page++;
            }
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Limit to target count
        allDialogues = allDialogues.slice(0, TARGET_COUNT);
        console.log(`[HappyDesk] Fetched ${allDialogues.length} dialogue summaries. Now collecting FULL histories...`);

        // 3. Fetch FULL history for each dialogue
        const fullDialogues = [];
        const telegramUsers = new Map(); // Using Map for deduplication

        for (let i = 0; i < allDialogues.length; i++) {
            const d = allDialogues[i];
            process.stdout.write(`[HappyDesk] [${i + 1}/${allDialogues.length}] Scraping full history for #${d.id} (${d.user?.name || 'User'})...\r`);
            
            // Extract Telegram info if available
            if (d.channel === 'telegram' || d.user?.telegram_username) {
                const tgKey = d.user?.telegram_username || d.user?.id;
                if (tgKey) {
                    telegramUsers.set(tgKey, {
                        dialogueId: d.id,
                        name: d.user?.name,
                        username: d.user?.telegram_username,
                        userId: d.user?.id,
                        channel: d.channelName
                    });
                }
            }

            let dialogueMessages: any[] = [];
            let lastMessageId = -1;
            let hasMoreMessages = true;

            while (hasMoreMessages) {
                try {
                    const msgResponse = await axios.get(`${BASE_URL}/chat/${d.id}/messages`, {
                        params: {
                            from: lastMessageId,
                            perPage: 100
                        },
                        headers: {
                            'x-auth-token': token,
                            'Accept': 'application/json'
                        }
                    });

                    const msgs = msgResponse.data.items || [];
                    dialogueMessages = [...dialogueMessages, ...msgs];

                    if (msgs.length < 100) {
                        hasMoreMessages = false;
                    } else {
                        // Set cursor to the oldest message in this batch
                        lastMessageId = msgs[msgs.length - 1].id;
                    }
                } catch (msgErr: any) {
                    console.error(`\n[HappyDesk]   !! Failed to fetch history for #${d.id}:`, msgErr.message);
                    hasMoreMessages = false;
                }
            }

            fullDialogues.push({
                ...d,
                messages: dialogueMessages
            });

            // Delay to avoid overwhelming API
            if (i % 3 === 0) await new Promise(resolve => setTimeout(resolve, 50));
        }
        console.log('\n[HappyDesk] Finished collecting histories.');

        // 4. Save results
        const scriptsDir = path.join(process.cwd(), 'scripts');
        fs.writeFileSync(path.join(scriptsDir, 'happydesk_full_dialogues.json'), JSON.stringify(fullDialogues, null, 2));
        fs.writeFileSync(path.join(scriptsDir, 'telegram_users_scrape.json'), JSON.stringify(Array.from(telegramUsers.values()), null, 2));

        console.log(`[HappyDesk] SAVED:`);
        console.log(`  - 1000 Full Dialogues -> scripts/happydesk_full_dialogues.json`);
        console.log(`  - ${telegramUsers.size} Telegram Users -> scripts/telegram_users_scrape.json`);

    } catch (e: any) {
        console.error('[HappyDesk] Scraping error:', e.response?.data || e.message);
    }
}

scrapeHappyDesk();

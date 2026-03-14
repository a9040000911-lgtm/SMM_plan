import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * HappyDesk Scraper for PrimeLike
 * (c) 2026 SMMplan
 */

const BASE_URL = 'https://primelike.happydesk.ru/panel/api';
const AUTH_URL = 'https://primelike.happydesk.ru/panel/api/v2/auth';

async function scrapeHappyDesk() {
    const email = 'support@primelike.ru';
    const password = 'V1i4gz6';

    console.log(`[HappyDesk] Starting scrape for ${email}...`);

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

        // 2. Fetch dialogues
        let allDialogues: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 5) { // Limit to 5 pages for initial test
            console.log(`[HappyDesk] Fetching page ${page}...`);
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
            
            console.log(`[HappyDesk] Received ${items.length} items.`);
            
            if (items.length < 50) {
                hasMore = false;
            } else {
                page++;
            }
        }

        // 3. Save results
        const outputPath = path.join(process.cwd(), 'scripts', 'happydesk_dialogues.json');
        fs.writeFileSync(outputPath, JSON.stringify(allDialogues, null, 2));
        console.log(`[HappyDesk] Saved ${allDialogues.length} dialogues to ${outputPath}`);

    } catch (e: any) {
        console.error('[HappyDesk] Scraping error:', e.response?.data || e.message);
    }
}

scrapeHappyDesk();

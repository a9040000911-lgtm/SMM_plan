import axios from 'axios';

const API_KEY = 'emrNjCPOuNMYKmMcxvHb532Xix99uAxM';
const API_URL = 'https://soc-rocket.ru/api/v2/';

async function main() {
    const formData = new URLSearchParams();
    formData.append('key', API_KEY);
    formData.append('action', 'services');

    try {
        const response = await axios.post(API_URL, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 30000
        });

        const data = response.data;
        if (Array.isArray(data)) {
            const socs = new Set();
            data.forEach(s => socs.add(s.soc));
            console.log('Unique "soc" values:', Array.from(socs));

            const telegramServices = data.filter(s => s.soc === 'telegram' || (s.category && s.category.toLowerCase().includes('telegram')));
            console.log('Total Telegram services:', telegramServices.length);
            console.log('Sample Telegram service:', JSON.stringify(telegramServices[0], null, 2));
        }
    } catch (error: any) {
        console.error('API Error:', error.message);
    }
}

main().catch(console.error);

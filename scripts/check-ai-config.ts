import { ConfigService } from './src/lib/config.service';
import dotenv from 'dotenv';
dotenv.config();

async function checkConfig() {
    try {
        const config = await ConfigService.getAiConfig();
        console.log('AI Config:', JSON.stringify(config, null, 2));
    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

checkConfig();

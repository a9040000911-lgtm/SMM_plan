import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function listModels() {
    // Enable Proxy
    try {
        const { ProxyAgent, setGlobalDispatcher } = await import('undici');
        setGlobalDispatcher(new ProxyAgent('http://127.0.0.1:7897'));
    } catch (e) {}

    try {
        const result = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }).listModels(); // This is just a guess at the API
        console.log('Available Models:');
        console.log(JSON.stringify(result, null, 2));
    } catch (e: any) {
        console.log('Error listing models:', e.message);
    }
}

listModels();

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function listModels() {
  try {
    const result = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }).listModels();
    console.log(JSON.stringify(result, null, 2));
  } catch (e: any) {
    console.log('Error listing models:', e.message);
    // Try alternative list method if available
  }
}

listModels();

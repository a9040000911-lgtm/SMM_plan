import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function listModels() {
  try {
    const result = await (genAI as any).listModels();
    console.log('Available Models:');
    console.log(JSON.stringify(result, null, 2));
  } catch (e: any) {
    console.log('Error listing models:', e.message);
    if (e.message.includes('not a function')) {
        console.log('The @google/generative-ai version may not support listModels directly on GenAI object. Checking docs...');
    }
  }
}

listModels();

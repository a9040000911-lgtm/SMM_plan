import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function testModels() {
  const models = ['gemini-3-flash', 'gemini-3-flash-preview', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  for (const m of models) {
    try {
      console.log(`Testing model: ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Hi");
      console.log(`✅ Success with ${m}`);
      return;
    } catch (e: any) {
      console.log(`❌ Failed with ${m}: ${e.message}`);
    }
  }
}

testModels();

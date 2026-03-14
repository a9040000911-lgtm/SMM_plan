
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function encrypt(text: string, secret: string): string {
    if (!text) return text;
    const key = crypto.createHash('sha256').update(secret).digest();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

async function testVexboostKey() {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error('NEXTAUTH_SECRET is not defined');

    const alternativeKey = 'XIXeUVGftzSXwAg8pbBJERcJpMmrg9qujHHM3y95xYvB3Q9VMnAHGYtpGnta';
    console.log('--- 🧪 Testing Alternative Vexboost Key ---');
    
    try {
        const res = await fetch(`https://vexboost.ru/api/v2?action=balance&key=${alternativeKey}`);
        const data = await res.json();
        console.log('Response:', JSON.stringify(data));
        
        if (data.balance !== undefined) {
            console.log('✅ Key is VALID! Balance:', data.balance);
            
            console.log('Updating database with valid key...');
            const encryptedKey = encrypt(alternativeKey, secret);
            await prisma.provider.update({
                where: { id: 'vexboost' },
                data: { apiKey: encryptedKey }
            });
            console.log('✅ Database updated.');
        } else {
            console.log('❌ Key is INVALID or error:', data.error);
        }
    } catch (err: any) {
        console.error('❌ Request failed:', err.message);
    }
}

testVexboostKey()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

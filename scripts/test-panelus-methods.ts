
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();
const ALGORITHM = 'aes-256-gcm';

function decrypt(encryptedText: string, secret: string): string {
    if (!encryptedText) return encryptedText;
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText;
    const [ivHex, authTagHex, encryptedValue] = parts;
    const key = crypto.createHash('sha256').update(secret).digest();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedValue, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

async function main() {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error('NEXTAUTH_SECRET missing');

    const provider = await prisma.provider.findFirst({ where: { name: { contains: 'Smmpanel' } } });
    if (!provider) {
        console.error('Smmpanel Us provider not found in DB');
        return;
    }

    const apiKey = decrypt(provider.apiKey, secret);
    const apiUrl = provider.apiUrl;

    console.log(`Testing methods for ${provider.name} at ${apiUrl}`);
    console.log(`API Key (first 4): ${apiKey.substring(0, 4)}...`);

    // 1. GET
    try {
        console.log('\n--- 1. Testing GET ---');
        const res = await fetch(`${apiUrl}?key=${apiKey}&action=balance`);
        const data = await res.text();
        console.log('GET Response:', data);
    } catch (e) {
        console.error('GET Error:', e.message);
    }

    // 2. POST (form)
    try {
        console.log('\n--- 2. Testing POST (form) ---');
        const params = new URLSearchParams();
        params.append('key', apiKey);
        params.append('action', 'balance');
        const res = await fetch(apiUrl, {
            method: 'POST',
            body: params,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const data = await res.text();
        console.log('POST (form) Response:', data);
    } catch (e) {
        console.error('POST (form) Error:', e.message);
    }

    // 3. POST (json)
    try {
        console.log('\n--- 3. Testing POST (json) ---');
        const res = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify({ key: apiKey, action: 'balance' }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.text();
        console.log('POST (json) Response:', data);
    } catch (e) {
        console.error('POST (json) Error:', e.message);
    }
}

main().finally(() => prisma.$disconnect());

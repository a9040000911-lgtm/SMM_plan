
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

async function verifyBalances() {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error('NEXTAUTH_SECRET is not defined');

    const providers = await prisma.provider.findMany({
        where: { isEnabled: true }
    });

    console.log(`--- 💰 Verifying ${providers.length} Providers (DEBUG REPSONSE) ---`);

    for (const p of providers) {
        try {
            console.log(`[${p.name}] Fetching balance...`);
            const apiKey = decrypt(p.apiKey, secret);
            
            let data: any;

            if (p.type === 'vexboost') {
                const res = await fetch(`${p.apiUrl}?action=balance&key=${apiKey}`);
                data = await res.json();
            } else {
                const params = new URLSearchParams();
                params.append('key', apiKey);
                params.append('action', 'balance');
                
                const res = await fetch(p.apiUrl, {
                    method: 'POST',
                    body: params,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });
                data = await res.json();
            }

            console.log(`[${p.name}] Raw Response:`, JSON.stringify(data));
        } catch (err: any) {
            console.error(`❌ [${p.name}] Failed: ${err.message}`);
        }
    }
}

verifyBalances()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

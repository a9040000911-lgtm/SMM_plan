
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

async function registerProviders() {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
        throw new Error('NEXTAUTH_SECRET is not defined in environment.');
    }

    const providers = [
        {
            id: 'vexboost',
            name: 'VexBoost',
            type: 'vexboost',
            apiUrl: 'https://vexboost.ru/api/v2',
            apiKey: 'MIdqHiwf1HYo6j6bL4WwyZFygHr5yqTZmGVzQzNJ9T8cSBwNC3ujkbyKhcCT',
            isEnabled: true,
            balanceThreshold: 1000,
            metadata: { currency: 'RUB' }
        },
        {
            id: 'socrocket',
            name: 'SocRocket',
            type: 'perfect-panel',
            apiUrl: 'https://soc-rocket.ru/api/v2/',
            apiKey: 'emrNjCPOuNMYKmMcxvHb532Xix99uAxM',
            isEnabled: true,
            balanceThreshold: 1000,
            metadata: { currency: 'RUB' }
        },
        {
            id: 'smmpanelus',
            name: 'Smmpanel Us',
            type: 'perfect-panel',
            apiUrl: 'https://smmpanelus.com/api/v2',
            apiKey: 'f51b6f1ffc6a3da808ddb868905fea4a',
            isEnabled: true,
            balanceThreshold: 10,
            metadata: { 
                requestType: 'json', 
                method: 'POST', 
                currency: 'USD' 
            }
        }
    ];

    console.log('--- 🔌 Registering SMM Providers (Production Standalone) ---');

    for (const p of providers) {
        console.log(`[${p.name}] Encrypting API Key...`);
        const encryptedKey = encrypt(p.apiKey, secret);

        console.log(`[${p.name}] Upserting to Database...`);
        await prisma.provider.upsert({
            where: { id: p.id },
            update: {
                name: p.name,
                type: p.type,
                apiUrl: p.apiUrl,
                apiKey: encryptedKey,
                isEnabled: p.isEnabled,
                balanceThreshold: p.balanceThreshold,
                metadata: p.metadata as any
            },
            create: {
                id: p.id,
                name: p.name,
                type: p.type,
                apiUrl: p.apiUrl,
                apiKey: encryptedKey,
                isEnabled: p.isEnabled,
                balanceThreshold: p.balanceThreshold,
                metadata: p.metadata as any
            }
        });
        console.log(`✅ [${p.name}] Registered successfully.`);
    }

    console.log('--- ✨ All Providers Integrated ---');
}

registerProviders()
    .catch(err => {
        console.error('❌ Failed to register providers:', err.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

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

async function register7Providers() {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
        throw new Error('NEXTAUTH_SECRET is not defined in environment.');
    }

    const providers = [
        {
            id: 'socrocket',
            name: 'SocRocket',
            type: 'perfect-panel',
            apiUrl: 'https://soc-rocket.ru/api/v2',
            apiKey: 'emrNjCPOuNMYKmMcxvHb532Xix99uAxM',
            isEnabled: true,
            balanceThreshold: 1000,
            metadata: { currency: 'RUB' }
        },
        {
            id: 'smmprime',
            name: 'SmmPrime',
            type: 'perfect-panel',
            apiUrl: 'https://smmprime.com/api/v2',
            apiKey: '6833e1ceef531d34e7442d492b8e1021',
            isEnabled: true,
            balanceThreshold: 1000,
            metadata: { currency: 'RUB' }
        },
        {
            id: 'streampromotion',
            name: 'Stream Promotion',
            type: 'stream-promotion', // Особый драйвер
            apiUrl: 'https://stream-promotion.ru/api/v2',
            apiKey: 'fGOsh7PtBk3Ckyq3UmqH6HVNYTC2gGTH',
            isEnabled: true,
            balanceThreshold: 1000,
            metadata: { currency: 'RUB' } // Или USD, надо будет уточнить баланс
        },
        {
            id: 'likedrom',
            name: 'Likedrom',
            type: 'perfect-panel',
            apiUrl: 'https://likedrom.com/api/v2', // Приводим к стандарту v2
            apiKey: '4f2aa7f20c56399b4790a4cd73f5b8c9',
            isEnabled: true,
            balanceThreshold: 1000,
            metadata: { currency: 'RUB' }
        },
        {
            id: 'smmpanelus',
            name: 'Smmpanel Us',
            type: 'perfect-panel',
            apiUrl: 'https://smmpanelus.com/api/v2',
            apiKey: '48a6494eb16406d1226dce68f30d631d',
            isEnabled: true,
            balanceThreshold: 10,
            metadata: { requestType: 'json', method: 'POST', currency: 'USD' }
        },
        {
            id: 'soc-proof',
            name: 'Soc-Proof',
            type: 'perfect-panel',
            apiUrl: 'https://soc-proof.su/api/v2',
            apiKey: 'a465d4013f1265153a2ca12bdd3cad06',
            isEnabled: true,
            balanceThreshold: 1000,
            metadata: { currency: 'RUB' }
        },
        {
            id: 'telegramshop', // Убираем точку для надежности ID
            name: 'Telegram.shop',
            type: 'perfect-panel',
            apiUrl: 'https://telegram.shop/api/v2',
            apiKey: 'abcd6e54ff5b77a11dc8077074445e04',
            isEnabled: true,
            balanceThreshold: 1000,
            metadata: { currency: 'RUB' }
        }
    ];

    console.log('--- 🛡️ Big Data Инициализация: Регистрация 7 Провайдеров ---');

    let idx = 1;
    for (const p of providers) {
        console.log(`[${idx}/7] ${p.name}... шифрование ключа.`);
        const encryptedKey = encrypt(p.apiKey, secret);

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
        console.log(`✅ [${p.name}] Успешно сохранен в базу.`);
        idx++;
    }

    console.log('--- ✨ Все провайдеры загружены в PostgreSQL ---');
}

register7Providers()
    .catch(err => {
        console.error('❌ Ошибка при регистрации:', err.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

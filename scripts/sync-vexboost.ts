import { PrismaClient, Platform, Category } from '../src/generated/client';

const prisma = new PrismaClient();

const API_URL = 'https://vexboost.ru/api/v2';
const API_KEY = 'LSHG25amARbTrJh7FVTCFafcwOpnxdLMf1xWTQ0C5BWnBWLquHog1mXj6OQi';

import crypto from 'crypto';

interface VexboostService {
    service: string;
    name: string;
    type: string;
    category: string;
    rate: string;
    min: string;
    max: string;
    cancel: boolean;
    refill: boolean;
}

async function syncVexboost() {
    console.log('Fetching from Vexboost API...');
    
    // fetch is available in Node > 18
    const response = await fetch(`${API_URL}?action=services&key=${API_KEY}`, {
        method: 'POST'
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const services: VexboostService[] = await response.json();
    console.log(`Received ${services.length} services from Vexboost`);

    if (!Array.isArray(services)) {
        console.error('Response is not an array!', services);
        return;
    }

    // Find the Vexboost provider
    let provider = await prisma.provider.findFirst({
        where: { name: { equals: 'vexboost', mode: 'insensitive' } }
    });

    if (!provider) {
        provider = await prisma.provider.create({
            data: {
                name: 'vexboost',
                apiKey: API_KEY,
                apiUrl: API_URL,
                isEnabled: true
            }
        });
    } else {
        await prisma.provider.update({
            where: { id: provider.id },
            data: { apiKey: API_KEY, apiUrl: API_URL }
        });
    }

    console.log(`Provider ID: ${provider.id}. Deleting old services...`);
    await prisma.providerService.deleteMany({
        where: { providerId: provider.id }
    });

    console.log('Inserting new services...');
    let inserted = 0;
    for (const svc of services) {
        const rawJsonString = JSON.stringify(svc);
        const dataHash = crypto.createHash('md5').update(rawJsonString).digest('hex');
        
        await prisma.providerService.create({
            data: {
                externalId: String(svc.service),
                name: svc.name,
                rawPrice: parseFloat(svc.rate) || 0,
                rawData: svc as any,
                providerId: provider.id,
                isActive: true,
                dataHash: dataHash,
                platform: Platform.OTHER,
                category: Category.OTHER
            }
        });
        inserted++;
    }

    console.log(`✅ Successfully synced ${inserted} Vexboost services!`);
}

syncVexboost()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

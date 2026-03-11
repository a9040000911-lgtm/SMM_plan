
import { prisma } from '../src/lib/prisma';
import { ProviderService } from '../src/services/providers/provider.service';

async function main() {
    const provider = await prisma.provider.findFirst({
        where: {
            OR: [
                { name: { contains: 'vexboost', mode: 'insensitive' } },
                { type: { contains: 'vexboost', mode: 'insensitive' } }
            ]
        }
    });

    if (!provider) {
        console.log('Provider "vexboost" not found in DB.');
        return;
    }

    console.log(`Checking Provider: ${provider.name} (${provider.type})`);
    console.log(`Enabled: ${provider.isEnabled}`);
    console.log(`API URL: ${provider.apiUrl}`);
    console.log(`ID: ${provider.id}`);

    try {
        const instance = await ProviderService.getInstance(provider.id);
        if (!instance) {
            console.log('Could not get provider instance (driver not found?).');
            return;
        }

        console.log('Attempting to check balance...');
        try {
            const balance = await instance.getBalance();
            console.log('Balance Check: SUCCESS');
            console.log('Balance Data:', JSON.stringify(balance, null, 2));
        } catch (e: any) {
            console.error('Balance Check: FAILED');
            console.error('Error Message:', e.message);
            if (e.response) {
                console.error('Response Status:', e.response.status);
                console.error('Response Data:', JSON.stringify(e.response.data, null, 2));
            }
            console.error('Stack:', e.stack);
        }

        console.log('Attempting to fetch services...');
        try {
            const services = await instance.getServices();
            console.log(`Services Check: SUCCESS. Found ${services.length} services.`);
            if (services.length > 0) {
                console.log('Sample service:', JSON.stringify(services[0], null, 2));
            }
        } catch (e: any) {
            console.error('Services Check: FAILED');
            console.error('Error Message:', e.message);
        }


    } catch (error: any) {
        console.error('General Script Error:', error.message);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

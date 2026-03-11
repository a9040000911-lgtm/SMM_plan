import { prisma } from '../src/lib/prisma';
import { CryptoService } from '../src/services/core/crypto.service';

async function diagnoseBots() {
    console.log('--- Bot Token Diagnosis ---');
    const envToken = process.env.TELEGRAM_BOT_TOKEN;
    console.log(`Env Token (masked): ${envToken?.substring(0, 10)}...`);

    const projects = await prisma.project.findMany();
    console.log(`Total projects in DB: ${projects.length}`);

    for (const p of projects) {
        if (p.botToken) {
            try {
                const decrypted = CryptoService.decrypt(p.botToken);
                const matchesEnv = decrypted === envToken;
                console.log(`Project: ${p.name} (${p.slug})`);
                console.log(`- Token in DB (masked): ${decrypted.substring(0, 10)}...`);
                console.log(`- Matches ENV token: ${matchesEnv}`);
                console.log(`- Is Active: ${p.isActive}`);
            } catch (e) {
                console.log(`Project: ${p.name} - FAILED TO DECRYPT`);
            }
        } else {
            console.log(`Project: ${p.name} - NO TOKEN`);
        }
    }
}

diagnoseBots()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

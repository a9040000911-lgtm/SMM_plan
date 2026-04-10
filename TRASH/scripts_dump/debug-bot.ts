import { prisma } from '../src/lib/prisma';
import { CryptoService } from '../src/services/core/crypto.service';

async function main() {
    console.log('--- BOT DEBUG START ---');
    const projects = await prisma.project.findMany({
        where: { isActive: true },
        select: { name: true, slug: true, botToken: true }
    });

    for (const p of projects) {
        if (!p.botToken) {
            console.log(`[${p.name}] No bot token`);
            continue;
        }
        try {
            const token = CryptoService.decrypt(p.botToken);
            const mask = token.substring(0, 5) + '...' + token.substring(token.length - 5);
            console.log(`[${p.name}] Bot: @${p.slug}, Token: ${mask}`);
        } catch (e: any) {
            console.log(`[${p.name}] DECRYPTION ERROR: ${e.message}`);
        }
    }
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});

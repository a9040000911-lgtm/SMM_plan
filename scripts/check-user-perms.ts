
import { prisma } from '../src/lib/prisma';

async function main() {
    const user = await prisma.user.findFirst({
        where: { email: 'art@artmspektr.ru' }
    });

    if (!user) {
        console.log('User art@artmspektr.ru not found!');
        return;
    }

    console.log('User Details:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- isGlobalAdmin: ${user.isGlobalAdmin}`);
    console.log(`- allowedTabs: ${JSON.stringify(user.allowedTabs)}`);
    console.log(`- tgId: ${user.tgId}`);
}

main().catch(console.error);

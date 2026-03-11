import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'art@artmspektr.ru';
    const tgId = 268747191; // Из .env

    console.log(`Updating user ${email} with tgId ${tgId}...`);

    const user = await prisma.user.findFirst({
        where: { email }
    });

    if (user) {
        await prisma.user.update({
            where: { id: user.id },
            data: { tgId: BigInt(tgId) }
        });
        console.log('User updated successfully!');
    } else {
        console.log('User not found!');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

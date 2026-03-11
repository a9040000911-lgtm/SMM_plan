
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            username: true,
            tgId: true,
            role: true,
            isGlobalAdmin: true
        }
    });

    console.log('Recent Users:');
    console.log(JSON.stringify(users, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
        , 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

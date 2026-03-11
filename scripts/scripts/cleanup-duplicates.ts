import { PrismaClient } from '../src/generated/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('--- CLEANUP START ---');

    // 1. Находим все дубликаты Email
    const emailDuplicates = await prisma.$queryRaw`
        SELECT email FROM "User" 
        WHERE email IS NOT NULL 
        GROUP BY email 
        HAVING COUNT(*) > 1
    ` as { email: string }[];

    for (const dup of emailDuplicates) {
        console.log(`Fixing duplicate email: ${dup.email}`);
        const users = await prisma.user.findMany({
            where: { email: dup.email },
            orderBy: { createdAt: 'desc' }
        });

        // Оставляем самого свежего, остальных удаляем (или мержим баланс)
        const [keep, ...remove] = users;
        console.log(`Keeping user ID: ${keep.id}, deleting ${remove.length} others`);

        for (const r of remove) {
            // Перед удалением переносим связанные заказы/баланс если нужно
            // В данном случае просто удаляем для чистоты миграции
            await prisma.user.delete({ where: { id: r.id } });
        }
    }

    // 2. Находим все дубликаты tgId
    const tgDuplicates = await prisma.$queryRaw`
        SELECT "tgId" FROM "User" 
        WHERE "tgId" IS NOT NULL 
        GROUP BY "tgId" 
        HAVING COUNT(*) > 1
    ` as { tgId: bigint }[];

    for (const dup of tgDuplicates) {
        console.log(`Fixing duplicate tgId: ${dup.tgId}`);
        const users = await prisma.user.findMany({
            where: { tgId: dup.tgId },
            orderBy: { createdAt: 'desc' }
        });

        const [keep, ...remove] = users;
        console.log(`Keeping user ID: ${keep.id}, deleting ${remove.length} others`);

        for (const r of remove) {
            await prisma.user.delete({ where: { id: r.id } });
        }
    }

    console.log('--- CLEANUP FINISHED ---');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

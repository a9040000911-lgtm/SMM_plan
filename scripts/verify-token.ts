import { verifyMagicToken } from '../src/lib/magic-auth';
import { prisma } from '../src/lib/prisma';

async function main() {
    const token = process.argv[2];
    if (!token) {
        console.error('Usage: npx tsx scripts/verify-token.ts <token>');
        process.exit(1);
    }

    try {
        console.log('Verifying token:', token);
        const payload = await verifyMagicToken(token);
        console.log('Payload:', payload);

        if (payload) {
            const user = await prisma.user.findFirst({
                where: {
                    id: payload.userId,
                    projectId: payload.projectId
                }
            });
            console.log('User found:', user ? { id: user.id, email: user.email, projectId: user.projectId } : 'NOT FOUND');
        }
    } catch (err: any) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();

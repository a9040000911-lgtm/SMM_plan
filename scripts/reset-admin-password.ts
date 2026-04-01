import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('Resetting password for art@artmspektr.ru to 12345678');
    const p = new PrismaClient();
    try {
        const h = await bcrypt.hash('12345678', 10);
        await p.user.update({
            where: { email: 'art@artmspektr.ru' },
            data: { password: h }
        });
        console.log('Password reset successfully.');
    } catch (e) {
        console.error('Error resetting password:', e);
    } finally {
        await p.$disconnect();
    }
}

main();

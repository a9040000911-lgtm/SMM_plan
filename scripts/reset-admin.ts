import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const newPassword = 'Admin12345';
  const email = 'art@artmspektr.ru'; // В нижнем регистре
  const telegramId = 268747191n;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  console.log('--- ADMIN PASSWORD RESET (SIMPLE) ---');

  const admin = await prisma.user.findFirst({
    where: { 
      OR: [
        { email: { equals: email, mode: 'insensitive' } },
        { tgId: telegramId }
      ]
    }
  });

  if (admin) {
    await prisma.user.update({
      where: { id: admin.id },
      data: { 
        email: email,
        password: hashedPassword,
        role: 'ADMIN',
        isGlobalAdmin: true,
        tgId: telegramId
      }
    });
    console.log(`✅ Updated existing admin: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        role: 'ADMIN',
        isGlobalAdmin: true,
        tgId: telegramId,
        username: 'admin'
      }
    });
    console.log(`✅ Created new admin: ${email}`);
  }

  console.log('-----------------------------------');
  console.log(`Login Email: ${email}`);
  console.log(`Password: ${newPassword}`);
  console.log('-----------------------------------');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'art@artmspektr.ru';
  const password = 'admin'; // We'll use 'admin' as password
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { 
      password: hashedPassword,
      role: 'ADMIN',
      isGlobalAdmin: true
    },
    create: {
      email,
      password: hashedPassword,
      role: 'ADMIN',
      isGlobalAdmin: true,
      username: 'Founder'
    }
  });

  console.log(`User ${email} updated/created with password "admin"`);
}

main().catch(console.error);

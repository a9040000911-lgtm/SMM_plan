import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash('agent123', 10);
  
  await prisma.user.upsert({
    where: { email: 'agent@smmplan.ru' },
    update: { role: 'ADMIN', balance: new Decimal(5000), password: passwordHash },
    create: {
      email: 'agent@smmplan.ru',
      username: 'Agent007',
      password: passwordHash,
      role: 'ADMIN',
      balance: new Decimal(5000),
    }
  });
  console.log('✅ Agent user agent@smmplan.ru created with password: agent123 and ADMIN role.');
}

main().catch(console.error).finally(() => prisma.$disconnect());

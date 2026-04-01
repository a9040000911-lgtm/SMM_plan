import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'art@artmspektr.ru';
  const password = 'ReliablePass2026!';
  const hashedPassword = await bcrypt.hash(password, 10);

  let project = await prisma.project.findFirst();
  if (!project) {
     project = await prisma.project.create({
       data: { name: 'Smmplan', slug: 'smmplan-local2', domain: 'localhost:5000' }
     });
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      isGlobalAdmin: true,
    },
    create: {
      email,
      password: hashedPassword,
      role: 'ADMIN',
      isGlobalAdmin: true,
      username: 'Art Admin',
      projectId: project.id
    }
  });

  console.log('Admin user ensured:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());

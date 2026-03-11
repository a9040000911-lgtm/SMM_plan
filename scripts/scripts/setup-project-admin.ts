import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- CREATING PROJECT ADMIN ---');
  const password = await bcrypt.hash('Admin123!', 10);

  const eliteProject = await prisma.project.findUnique({ where: { slug: 'elite' } });
  if (!eliteProject) return console.error('❌ Elite project not found');

  const email = 'admin-elite@smmplan.com';
  const user = await prisma.user.findFirst({ where: { email } });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        role: 'ADMIN', 
        isGlobalAdmin: false,
        accessibleProjects: { set: [{ id: eliteProject.id }] }
      }
    });
    console.log(`✅ Updated: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        email,
        password,
        role: 'ADMIN',
        isGlobalAdmin: false,
        username: 'elite_boss',
        accessibleProjects: { connect: [{ id: eliteProject.id }] }
      }
    });
    console.log(`✅ Created: ${email}`);
  }
}

main().finally(() => prisma.$disconnect());
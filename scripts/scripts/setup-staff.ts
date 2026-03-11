import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- CREATING SUPPORT STAFF ---');
  const password = await bcrypt.hash('Support123!', 10);

  // 1. Получаем ID проектов
  const smmPlan = await prisma.project.findUnique({ where: { slug: '101' } });
  const eliteBooster = await prisma.project.findUnique({ where: { slug: 'elite' } });

  if (!smmPlan || !eliteBooster) {
    console.error('❌ Error: Projects not found. Run setup-demo.ts first.');
    return;
  }

  const staff = [
    { 
        email: 'support1@smmplan.com', 
        username: 'support_smm', 
        projectId: smmPlan.id 
    },
    { 
        email: 'support2@smmplan.com', 
        username: 'support_elite', 
        projectId: eliteBooster.id 
    }
  ];

  for (const s of staff) {
    const user = await prisma.user.findFirst({ where: { email: s.email } });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          role: 'SUPPORT', 
          isGlobalAdmin: false,
          accessibleProjects: { set: [{ id: s.projectId }] }
        }
      });
      console.log(`✅ Updated ${s.email}`);
    } else {
      await prisma.user.create({
        data: {
          email: s.email,
          password: password,
          role: 'SUPPORT',
          isGlobalAdmin: false,
          username: s.username,
          accessibleProjects: { connect: [{ id: s.projectId }] }
        }
      });
      console.log(`✅ Created ${s.email}`);
    }
  }

  console.log('-----------------------------------');
  console.log('Credentials:');
  console.log('User 1: support1@smmplan.com / Support123!');
  console.log('User 2: support2@smmplan.com / Support123!');
  console.log('-----------------------------------');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
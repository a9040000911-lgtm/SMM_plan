import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function backup() {
  const is = await prisma.internalService.findMany();
  const pso = await prisma.projectServiceOverride.findMany();
  fs.writeFileSync('db_backup_is.json', JSON.stringify(is, null, 2));
  fs.writeFileSync('db_backup_pso.json', JSON.stringify(pso, null, 2));
  console.log('Backup successful');
}

backup().catch(console.error).finally(() => prisma.$disconnect());

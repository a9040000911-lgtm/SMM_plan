import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Searching for underscores in DB...');
  
  // Checking SocialPlatform
  const platforms = await prisma.socialPlatform.findMany({});
  const pList = platforms.filter(p => p.name.includes('_') || (p.slug && p.slug.includes('_')));
  console.log('Platforms with actual underscores:', pList);

  const categories = await prisma.serviceCategory.findMany({});
  const cList = categories.filter(c => c.name.includes('_') || (c.slug && c.slug.includes('_')));
  console.log('Categories with actual underscores:', cList);

  const services = await prisma.internalService.findMany({});
  const sList = services.filter(s => s.name.includes('___') || (s.targetType && s.targetType.includes('___')));
  console.log('Services with actual triple underscores:', sList.map(s => s.name).slice(0, 10));
}

main().catch(console.error).finally(() => prisma.$disconnect());

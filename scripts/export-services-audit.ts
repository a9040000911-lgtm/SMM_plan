import { PrismaClient } from '@prisma/client';
import { SmartAnalyzerLogic } from '../src/services/providers/smart-analyzer.logic';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Service Audit Export...');
  
  const services = await prisma.providerService.findMany({
    include: {
      provider: true
    }
  });

  console.log(`📦 Found ${services.length} services in database.`);

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `services_audit_${dateStr}.csv`;
  const filePath = path.join(process.cwd(), fileName);

  const header = [
    'Provider ID',
    'External ID',
    'Service Name',
    'Original Category',
    'Detected Platform',
    'Detected Category',
    'Detected TargetType',
    'Detected Geo',
    'Detected Warranty',
    'Is Private',
    'Requirements'
  ].join('\t'); // Tab-separated for easier Excel import

  const rows = [header];

  for (const s of services) {
    const analysis = SmartAnalyzerLogic.detectSync(s.name, s.description || '', s.category);
    
    // Escape tabs and newlines
    const cleanName = s.name.replace(/\t/g, ' ').replace(/\n/g, ' ');
    const cleanReq = (analysis.requirements || '').replace(/\t/g, ' ').replace(/\n/g, ' ');

    const row = [
      s.provider.name,
      s.externalId,
      cleanName,
      s.category,
      analysis.platform,
      analysis.category,
      analysis.targetType,
      analysis.geo || 'WORLDWIDE',
      analysis.warranty || 0,
      analysis.isPrivate ? 'YES' : 'NO',
      cleanReq
    ].join('\t');
    
    rows.push(row);
  }

  fs.writeFileSync(filePath, rows.join('\n'), 'utf-8');
  console.log(`✅ Success! Exported to: ${filePath}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during export:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

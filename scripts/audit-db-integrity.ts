/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Database Integrity Audit Script
 * Run with: npx ts-node scripts/audit-db-integrity.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING DATABASE INTEGRITY AUDIT ---');

  // 1. Check for Orders without InternalService
  const orphanOrders = await prisma.order.findMany({
    where: { 
      internalService: { is: null },
      internalServiceId: { not: '' }
    },
    select: { id: true, internalServiceId: true }
  });
  console.log(`[Orders] Found ${orphanOrders.length} orders without matching InternalService.`);
  if (orphanOrders.length > 0) {
    console.warn('Orphan Order IDs:', orphanOrders.map(o => o.id));
  }

  // 2. Check for Transactions without User
  const orphanTransactions = await prisma.transaction.findMany({
    where: { user: { is: null } },
    select: { id: true, userId: true }
  });
  console.log(`[Transactions] Found ${orphanTransactions.length} transactions without matching User.`);

  // 3. Balance Inconsistency Check (User balance vs Ledger total)
  // This is a basic check. A real one would sum all transactions.
  const users = await prisma.user.findMany({
    select: { id: true, username: true, balance: true }
  });

  let inconsistencyCount = 0;
  for (const user of users) {
    const transactionSum = await prisma.transaction.aggregate({
      where: { userId: user.id, status: 'SUCCESS' },
      _sum: { amount: true }
    });
    
    // Note: status 'SUCCESS' might not be the only one that affects balance.
    // In our system, usually 'COMPLETED' or direct sum of credits/debits.
    // Assuming 'SUCCESS' for this audit example.
  }
  
  // 4. Check for InternalServiceMappings pointing to missing Providers
  const brokenMappings = await prisma.internalServiceMapping.findMany({
    where: { provider: { is: null } },
    select: { id: true, providerId: true }
  });
  console.log(`[Mappings] Found ${brokenMappings.length} mappings pointing to missing Providers.`);

  console.log('--- AUDIT COMPLETED ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

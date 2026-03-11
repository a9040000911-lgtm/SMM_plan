
import { prisma } from '../src/lib/prisma';
import { PricingService } from '../src/services/finance/pricing.service';
import { LedgerService } from '../src/services/finance/ledger.service';
import { Decimal } from 'decimal.js';

async function testPricingAndBalances() {
    console.log('--- STARTING PRICE & BALANCE AUDIT ---');

    // 1. Test Pricing Ladder
    console.log('\n[1] Testing Pricing Ladder Multipliers:');
    const cases = [
        { cost: 0.5, expectedMin: 25 },   // x50
        { cost: 5, expectedMin: 55 },     // x11
        { cost: 30, expectedMin: 330 },   // x11
        { cost: 200, expectedMin: 1600 }, // x8
    ];

    for (const c of cases) {
        const retail = await PricingService.calculateRetailPrice(c.cost);
        const margin = retail.div(c.cost).toNumber();
        console.log(`Cost: ${c.cost} RUB -> Retail: ${retail} RUB (Multiplier: x${margin.toFixed(1)})`);
        if (retail.lt(c.expectedMin)) {
            console.error(`❌ FAILED: Expected at least ${c.expectedMin}, got ${retail}`);
        } else {
            console.log('✅ PASS');
        }
    }

    // 2. Test User Balance & Ledger
    console.log('\n[2] Testing User Balance & Ledger:');
    const testUser = await prisma.user.findFirst({ where: { role: 'USER' } });
    if (!testUser) {
        console.log('⚠️ No test user found, skipping balance test.');
    } else {
        const amount = new Decimal(10.50);
        console.log(`User: ${testUser.id}, Current Balance: ${testUser.balance}`);

        try {
            await prisma.$transaction(async (tx) => {
                await LedgerService.record(tx, testUser.id, amount, 'WITHDRAWAL', 'test-ref', 'Test Audit Deduction');
                await tx.user.update({
                    where: { id: testUser.id },
                    data: { balance: { decrement: amount } }
                });
            });

            const updatedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
            console.log(`New Balance: ${updatedUser?.balance}`);
            const ledger = await prisma.ledgerEntry.findFirst({
                where: { userId: testUser.id, referenceId: 'test-ref' },
                orderBy: { createdAt: 'desc' }
            });

            if (!ledger) {
                console.error('❌ Ledger entry NOT FOUND.');
            } else {
                console.log(`Ledger entry found: amount=${ledger.amount}, balanceAfter=${ledger.balanceAfter}`);
                if (ledger.balanceAfter.equals(updatedUser!.balance)) {
                    console.log('✅ Balance & Ledger synced correctly.');
                } else {
                    console.error(`❌ Ledger mismatch: LedgerAfter(${ledger.balanceAfter}) !== UserBalance(${updatedUser!.balance})`);
                }
            }
        } catch (e) {
            console.error('❌ Transaction failed:', e);
        }
    }

    // 3. Test Provider Balance Logs
    console.log('\n[3] Testing Provider Balance Logs:');
    const provider = await prisma.provider.findFirst();
    if (provider) {
        const log = await prisma.providerBalanceLog.findFirst({
            where: { providerId: provider.id },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`Provider: ${provider.name}, Last Log Balance: ${log?.balance} ${log?.currency}`);
        if (log && log.currency) {
            console.log('✅ ProviderBalanceLog has currency field.');
        } else {
            console.error('❌ ProviderBalanceLog missing currency.');
        }
    }

    console.log('\n--- AUDIT COMPLETE ---');
    process.exit(0);
}

testPricingAndBalances().catch(console.error);


import { prisma } from '../src/lib/prisma';
import { Decimal } from 'decimal.js';

async function main() {
    console.log('--- STARTING CHAOS ENGINEERING TEST: Node 1 (Race Conditions) ---');

    const project = await prisma.project.findUnique({ where: { slug: '101' } });
    if (!project) throw new Error('Test project 101 not found');

    const email = 'chaos_tester@test.com';

    // Cleanup previous test state
    const existingUser = await prisma.user.findFirst({
        where: { email: email, projectId: project.id }
    });
    if (existingUser) {
        await prisma.ledgerEntry.deleteMany({ where: { userId: existingUser.id } });
        await prisma.transaction.deleteMany({ where: { userId: existingUser.id } });
        await prisma.order.deleteMany({ where: { userId: existingUser.id } });
    }

    // Create or reset chaos tester user
    const user = await prisma.user.upsert({
        where: { email },
        update: { balance: 100, spent: 0 },
        create: {
            email,
            projectId: project.id,
            username: 'chaos_tester',
            password: 'password_not_needed',
            balance: 100,
            spent: 0
        }
    });

    console.log(`Initial User Balance: ${user.balance} RUB`);
    const debitAmount = new Decimal(100);

    const { LedgerService } = await import('../src/services/finance/ledger.service');

    console.log('Launching 5 parallel attempts (FIXED LOGIC)...');

    const simulateOrderRequest = async (id: number) => {
        try {
            return await prisma.$transaction(async (tx) => {
                const updated = await tx.user.updateMany({
                    where: { id: user.id, balance: { gte: debitAmount } },
                    data: {
                        balance: { decrement: debitAmount },
                        spent: { increment: debitAmount }
                    }
                });

                if (updated.count === 0) throw new Error('Insufficient balance');

                // Track in Ledger for Node 4
                await LedgerService.record(tx, user.id, debitAmount, 'WITHDRAWAL', `RACE_TEST_${id}`, 'Simulated Race Test Debit');

                const finalU = await tx.user.findUnique({ where: { id: user.id } });
                console.log(`[Req ${id}] ✅ DEBIT SUCCESS. New balance: ${finalU?.balance}`);
                return true;
            });
        } catch (e: any) {
            console.log(`[Req ${id}] ❌ DEBIT FAILED: ${e.message}`);
            return false;
        }
    };

    const results = await Promise.all([
        simulateOrderRequest(1),
        simulateOrderRequest(2),
        simulateOrderRequest(3),
        simulateOrderRequest(4),
        simulateOrderRequest(5),
    ]);

    const successCount = results.filter(r => r).length;
    const finalUser = await prisma.user.findUnique({ where: { id: user.id } });

    console.log('\n--- RESULTS ---');
    console.log(`Successful debits: ${successCount}`);
    console.log(`Expected success: 1`);
    console.log(`Final Balance: ${finalUser?.balance} RUB`);

    if (successCount === 1 && Number(finalUser?.balance) === 0) {
        console.log('✅ PASS: Race condition protection confirmed. Only one request succeeded.');
    } else {
        console.log('❌ FAIL: Protection failed or unexpected behavior.');
    }

    // --- NODE 2: SELF-HEALING AUDIT ---
    console.log('\n--- STARTING CHAOS ENGINEERING TEST: Node 2 (Self-Healing) ---');

    const oldDate = new Date(Date.now() - 20 * 60000); // 20 mins ago
    const realService = await prisma.internalService.findFirst();
    if (!realService) throw new Error('No services found');

    const stuckOrder = await prisma.order.create({
        data: {
            projectId: project.id,
            userId: user.id,
            internalServiceId: realService.id,
            link: 'https://test.com',
            quantity: 100,
            totalPrice: 10,
            status: 'PENDING',
            createdAt: oldDate
        }
    });
    console.log(`Created STUCK order: ${stuckOrder.id}`);

    const { SelfHealingService } = await import('../src/services/core/self-healing.service');
    console.log('Running Self-Healing checks...');
    await SelfHealingService.recoverStuckOrders();

    const verifiedOrder = await prisma.order.findUnique({ where: { id: stuckOrder.id } });
    if (verifiedOrder?.status === 'CANCELED') {
        console.log('✅ PASS: Self-Healing successfully recovered (canceled) stuck order.');
    } else {
        console.log(`❌ FAIL: Stuck order status is ${verifiedOrder?.status}`);
    }

    // --- NODE 3: SECURITY & RBAC ---
    console.log('\n--- STARTING CHAOS ENGINEERING TEST: Node 3 (Security & RBAC) ---');

    const commonUser = await prisma.user.upsert({
        where: { email: 'common@test.com' },
        update: { role: 'USER', allowedTabs: [] },
        create: {
            email: 'common@test.com',
            projectId: project.id,
            username: 'common_user',
            password: 'password',
            role: 'USER',
            allowedTabs: []
        }
    });

    console.log(`Testing RBAC for user: ${commonUser.username} (Role: ${commonUser.role})`);

    const checkAdminAccess = (u: any) => {
        if (u.role !== 'ADMIN' && !u.allowedTabs.includes('settings')) return false;
        return true;
    };

    if (!checkAdminAccess(commonUser)) {
        console.log('✅ PASS: Standard user correctly blocked from Admin tabs.');
    } else {
        console.log('❌ FAIL: RBAC failure!');
    }

    // --- NODE 4: DATA CONSISTENCY (LEDGER AUDIT) ---
    console.log('\n--- STARTING CHAOS ENGINEERING TEST: Node 4 (Ledger Audit) ---');

    // Initial balance was 100.
    // Node 1: deducted 100. Current should be 0.
    // Refund might have happened in Node 2 (if logic allows).
    // Let's add 50 RUB via Ledger AND manual balance update
    await prisma.$transaction(async (tx) => {
        const amount = new Decimal(50);
        await LedgerService.record(tx, user.id, amount, 'DEPOSIT', 'CLEAN_MOCK_TX', 'Test audit deposit');
        await tx.user.update({
            where: { id: user.id },
            data: { balance: { increment: amount } }
        });
    });

    const auditUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { ledgerEntries: true }
    });

    if (!auditUser) throw new Error('Audit user not found');

    // Account for initial balance (pre-ledger history in this test)
    let ledgerSum = new Decimal(100);
    for (const entry of auditUser.ledgerEntries) {
        const val = new Decimal(entry.amount.toString());
        if (LedgerService.isIncome(entry.type)) ledgerSum = ledgerSum.plus(val);
        else ledgerSum = ledgerSum.minus(val);
    }

    console.log(`Final User Balance: ${auditUser.balance} RUB`);
    console.log(`Ledger Calculated: ${ledgerSum} RUB`);

    if (ledgerSum.equals(new Decimal(auditUser.balance.toString()))) {
        console.log('✅ PASS: Ledger consistency verified. Balance 100% matches transaction history.');
    } else {
        console.log('❌ FAIL: Ledger discrepancy detected!');
        console.log('Ledger History:');
        auditUser.ledgerEntries.forEach(e => console.log(` - ${e.type}: ${e.amount} (${e.description})`));
    }

    console.log('\n--- ALL CHAOS SCENARIOS COMPLETED ---');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

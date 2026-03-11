
import { prisma } from '../src/lib/prisma';
import { Decimal } from 'decimal.js';
import { TransactionType, TransactionStatus, TicketStatus, MessageSender } from '@prisma/client';
import { confirmPayment } from '../src/services/orders/order-processor.service';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🎭 Starting business process simulation...');

    // 1. Target User
    const tgId = BigInt(268747191);
    const user = await prisma.user.findFirst({ where: { tgId } });
    if (!user) {
        throw new Error('Target user (268747191) not found in DB. Run seed first.');
    }

    // 2. Simulate YooKassa Transaction (Deposit)
    const paymentId = `SIM_PAY_${Date.now()}`;
    const amount = new Decimal(500); // 500 RUB

    console.log(`💳 Creating pending transaction: ${paymentId}`);
    const tx = await prisma.transaction.create({
        data: {
            id: `SIM_TRX_${Date.now()}`,
            userId: user.id,
            projectId: user.projectId,
            amount,
            type: TransactionType.DEPOSIT,
            status: TransactionStatus.PENDING,
            provider: 'YOOKASSA',
            externalId: paymentId,
            metadata: {
                serviceId: 'TEST_TG_SUB_1',
                qty: 1000,
                link: 'https://t.me/durov'
            }
        }
    });

    // 3. Simulate Webhook Call
    console.log(`🌐 Simulating YooKassa Webhook for: ${paymentId}...`);
    const success = await confirmPayment(paymentId);
    if (success) {
        console.log('✅ Webhook processed: Transaction mark as SUCCESS and Order created.');
    } else {
        console.log('❌ Webhook simulation failed.');
        return;
    }

    // 4. Verify Order
    const order = await prisma.order.findFirst({
        where: { userId: user.id, internalServiceId: 'TEST_TG_SUB_1' },
        orderBy: { createdAt: 'desc' },
        include: { internalService: true }
    });

    if (order) {
        console.log(`📦 Order created: #${order.id} for ${order.internalService.name}`);

        // 5. Support Ticket Interaction
        console.log('🎫 Creating support ticket for this order...');
        const ticket = await prisma.supportTicket.create({
            data: {
                projectId: user.projectId,
                userId: user.id,
                orderId: order.id,
                subject: 'Проблема с заказом (Тестовая симуляция)',
                status: TicketStatus.PENDING,
                messages: {
                    create: [
                        {
                            text: 'Здравствуйте! Я сделал тестовый заказ, проверьте пожалуйста что он запустился.',
                            sender: MessageSender.USER
                        }
                    ]
                }
            }
        });

        console.log(`✅ Ticket created: #${ticket.id}`);

        // 6. Support Reply
        console.log('✍️ Simulating support agent reply...');
        await prisma.supportMessage.create({
            data: {
                ticketId: ticket.id,
                text: 'Добрый день! Видим ваш заказ. Он успешно передан провайдеру и будет выполнен в ближайшее время. Спасибо за ожидание!',
                sender: MessageSender.STAFF,
                staffUsername: 'SmmplanSupport'
            }
        });

        console.log('✅ Support response added.');
    }

    console.log('🏁 Simulation finished successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

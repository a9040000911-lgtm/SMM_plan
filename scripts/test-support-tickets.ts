/**
 * Create test support tickets for E2E support flow testing.
 * Run: npx tsx scripts/test-support-tickets.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TICKET_SCENARIOS = [
    {
        subject: 'Заказ не выполняется уже 2 часа',
        category: 'ORDER_ISSUE',
        messages: [
            { sender: 'USER', text: 'Здравствуйте! Я сделал заказ #6 на подписчиков VK 2 часа назад, но до сих пор ничего не произошло. Статус "В обработке", но подписчиков нет. Помогите, пожалуйста!' },
            { sender: 'STAFF', text: 'Добрый день! Спасибо за обращение. Проверяю ваш заказ #6...' },
            { sender: 'SYSTEM', text: '🔍 Заказ #6 найден: VK Подписчики, 600 шт, статус: PROCESSING, провайдер: Stream Promotion Mock' },
            { sender: 'STAFF', text: 'Заказ передан провайдеру, но мы видим задержку на его стороне. Я поставлю ваш заказ в приоритетную очередь. Ожидайте выполнения в течение 30 минут.' },
            { sender: 'USER', text: 'Спасибо! Буду ждать.' },
        ]
    },
    {
        subject: 'Запрос на возврат средств',
        category: 'REFUND',
        messages: [
            { sender: 'USER', text: 'Добрый день. Хочу вернуть деньги за заказ #7, качество подписчиков меня не устроило, все аккаунты без аватарок.' },
            { sender: 'STAFF', text: 'Здравствуйте! Принял ваш запрос. Проведу аудит качества.' },
            { sender: 'SYSTEM', text: '⚠️ Запрос на возврат. Заказ #7: OK.RU Репосты, 600 шт, сумма: 7411.20₽' },
        ]
    },
    {
        subject: 'Как оформить заказ на Telegram?',
        category: 'GENERAL',
        messages: [
            { sender: 'USER', text: 'Привет! Я первый раз на вашем сайте. Подскажите, как заказать подписчиков в Telegram канал? И какая ссылка нужна?' },
            { sender: 'STAFF', text: 'Добро пожаловать! 🎉 Для заказа подписчиков в Telegram:\n\n1. Перейдите в Каталог → Telegram → Подписчики\n2. Вставьте ссылку на ваш канал (формат: https://t.me/your_channel)\n3. Выберите количество\n4. Оплатите заказ\n\nЕсли канал приватный, вам нужно будет создать invite-ссылку.' },
            { sender: 'USER', text: 'А можно оплатить через карту?' },
            { sender: 'STAFF', text: 'Да, мы принимаем все банковские карты через ЮKassa. Также доступна оплата через СБП (QR-код). После оплаты заказ начнёт выполняться автоматически.' },
            { sender: 'USER', text: 'Супер, спасибо! Попробую сейчас.' },
            { sender: 'STAFF', text: 'Если будут вопросы — пишите, я на связи! 👋' },
        ]
    },
    {
        subject: 'Списались подписчики через 3 дня',
        category: 'WARRANTY',
        messages: [
            { sender: 'USER', text: 'Я заказывал 1000 подписчиков в VK группу неделю назад. Сначала всё было ок, но за последние 3 дня отписалось 200 человек. У вас есть гарантия?' },
        ]
    },
];

async function main() {
    console.log('🎫 Создание тестовых тикетов поддержки...\n');

    const project = await prisma.project.findFirst();
    if (!project) { console.error('❌ Нет проекта'); return; }

    // Find or create test user
    let testUser = await prisma.user.findFirst({ where: { email: 'test-orders@smmplan.dev', projectId: project.id } });
    if (!testUser) {
        const bcrypt = await import('bcryptjs');
        testUser = await prisma.user.create({
            data: {
                email: 'test-orders@smmplan.dev',
                password: await bcrypt.hash('testpass123', 10),
                username: 'test_client',
                projectId: project.id,
                balance: 50000
            }
        });
    }

    // Create a second test user for variety
    let testUser2 = await prisma.user.findFirst({ where: { email: 'premium-client@smmplan.dev', projectId: project.id } });
    if (!testUser2) {
        const bcrypt = await import('bcryptjs');
        testUser2 = await prisma.user.create({
            data: {
                email: 'premium-client@smmplan.dev',
                password: await bcrypt.hash('premium123', 10),
                username: 'premium_user',
                projectId: project.id,
                balance: 150000,
                spent: 450000,
                tgId: '268747191'
            }
        });
    }

    const users = [testUser, testUser2, testUser, testUser2];

    // Clean old test tickets
    const oldTickets = await prisma.supportTicket.findMany({
        where: { subject: { in: TICKET_SCENARIOS.map(s => s.subject) } },
        select: { id: true }
    });
    if (oldTickets.length > 0) {
        await prisma.supportMessage.deleteMany({ where: { ticketId: { in: oldTickets.map(t => t.id) } } });
        await prisma.supportTicket.deleteMany({ where: { id: { in: oldTickets.map(t => t.id) } } });
        console.log(`  🧹 Удалено ${oldTickets.length} старых тестовых тикетов`);
    }

    for (let i = 0; i < TICKET_SCENARIOS.length; i++) {
        const scenario = TICKET_SCENARIOS[i];
        const user = users[i % users.length];
        
        const statuses = ['OPEN', 'PENDING', 'OPEN', 'OPEN'];
        
        const ticket = await prisma.supportTicket.create({
            data: {
                userId: user.id,
                projectId: project.id,
                subject: scenario.subject,
                status: statuses[i] as any,
            }
        });

        // Create messages with staggered timestamps
        const baseTime = new Date();
        baseTime.setHours(baseTime.getHours() - (TICKET_SCENARIOS.length - i));

        for (let j = 0; j < scenario.messages.length; j++) {
            const msg = scenario.messages[j];
            const msgTime = new Date(baseTime.getTime() + j * 5 * 60 * 1000); // 5 min apart

            await prisma.supportMessage.create({
                data: {
                    ticketId: ticket.id,
                    sender: msg.sender as any,
                    text: msg.text,
                    createdAt: msgTime,
                    ...(msg.sender === 'STAFF' ? { staffUsername: 'Admin' } : {})
                }
            });
        }

        const lastMsg = scenario.messages[scenario.messages.length - 1];
        const hasUnread = lastMsg.sender === 'USER'; // unread = last message from user

        console.log(`  ✅ Тикет "${scenario.subject}"`);
        console.log(`     → Пользователь: ${user.email}, Статус: ${statuses[i]}, Сообщений: ${scenario.messages.length}`);
        console.log(`     → ${hasUnread ? '🔴 Есть непрочитанное от клиента' : '🟢 Ответ отправлен'}`);
    }

    console.log(`\n📊 Итого: создано ${TICKET_SCENARIOS.length} тестовых тикетов`);
    console.log('\n🌐 Откройте для проверки:');
    console.log('   Клиент:  http://localhost:3000/support');
    console.log('   Админ:   http://localhost:3000/admin/support');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

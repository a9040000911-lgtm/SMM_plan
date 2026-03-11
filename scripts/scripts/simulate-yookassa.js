
const axios = require('axios');

/**
 * Симулятор уведомления от ЮKassa
 * Инструкция:
 * 1. Запусти сервер (npm run dev или npm run start)
 * 2. Убедись, что у тебя есть PENDING транзакция (создается при попытке пополнения)
 * 3. Подставь externalId из базы данных в переменную paymentId ниже
 * 4. Запусти: node scripts/simulate-yookassa.js
 */

const TARGET_URL = 'http://localhost:3000/api/webhooks/yookassa';
const paymentId = process.argv[2]; // Берем ID из аргументов командной строки

if (!paymentId) {
    console.error('❌ Ошибка: Укажите ID платежа (externalId из таблицы Transaction)');
    console.log('Пример: node scripts/simulate-yookassa.js 2726615b-000f-5000-8000-1120427806f7');
    process.exit(1);
}

const payload = {
    type: "notification",
    event: "payment.succeeded",
    object: {
        id: paymentId,
        status: "succeeded",
        amount: {
            value: "100.00",
            currency: "RUB"
        },
        income_amount: {
            value: "96.50",
            currency: "RUB"
        },
        description: "Пополнение баланса",
        recipient: {
            account_id: "123456",
            gateway_id: "654321"
        },
        payment_method: {
            type: "bank_card",
            id: "2726615b-000f-5000-8000-1120427806f7"
        },
        captured_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        test: true,
        refunded_amount: {
            value: "0.00",
            currency: "RUB"
        },
        paid: true,
        refundable: true,
        metadata: {},
        authorization_details: {
            rrn: "123456789012",
            auth_code: "123456"
        }
    }
};

async function sendWebhook() {
    console.log(`📡 Отправка симуляции платежа ${paymentId} на ${TARGET_URL}...`);
    try {
        const response = await axios.post(TARGET_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'x-debug-simulator': 'true' // Спец-заголовок для обхода проверки API в DEV режиме
            }
        });
        console.log('✅ Ответ сервера:', response.status, response.data);
    } catch (error) {
        console.error('❌ Ошибка при отправке:', error.response?.status, error.response?.data || error.message);
    }
}

sendWebhook();

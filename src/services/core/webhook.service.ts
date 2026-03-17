/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import express from 'express';
import { PaymentConfirmationService } from '@/services/orders/payment-confirmation.service';
import { PaymentService } from '@/services/finance/payment.service';
import { ConfigService } from '@/lib/config.service';

const app = express();
app.use(express.json());

const PORT = ConfigService.getSystemConfig().webhookPort;

export function startWebhookServer() {
  // Эндпоинт для ЮKassa
  app.post('/webhooks/yookassa', async (req, res) => {
    try {
      const event = req.body;

      // БЕЗОПАСНОСТЬ: Игнорируем всё, кроме успешных платежей
      if (event.event !== 'payment.succeeded') {
        return res.status(200).send('OK');
      }

      const paymentId = event.object.id;
      console.log(`[Webhook] Verification start for payment: ${paymentId}`);

      // КРИТИЧЕСКИЙ ШАГ: Контрольная проверка через API ЮKassa
      const realPayment = await PaymentService.getPaymentStatus(paymentId);

      if (realPayment && realPayment.status === 'succeeded') {
        // Используем сервис подтверждения напрямую
        const success = await PaymentConfirmationService.confirmPayment(paymentId);
        if (success) {
          console.log(`[Webhook] Payment ${paymentId} verified and confirmed.`);
        }
      } else {
        console.warn(`[Webhook Alert] Received fake or failed payment notification: ${paymentId}`);
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('[Webhook Error]', error);
      res.status(500).send('Internal Error');
    }
  });

  const server = app.listen(PORT, () => {
    console.log(`--- WEBHOOK SERVER STARTED ON PORT ${PORT} ---`);
    console.log(`Endpoint: /webhooks/yookassa`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`!!! FATAL: Port ${PORT} is already in use. Please kill the process manually or change WEBHOOK_PORT in .env !!!`);
      process.exit(1);
    } else {
      console.error('!!! WEBHOOK SERVER ERROR:', err);
    }
  });
}

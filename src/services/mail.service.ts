/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import nodemailer from 'nodemailer';
import { ConfigService } from '@/services/core/config.service';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  const config = await ConfigService.getSmtpConfig();

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
  return transporter;
}

/**
 * Отправляет код подтверждения на почту
 */
export async function send2FACodeEmail(to: string, code: string) {
  const config = await ConfigService.getSmtpConfig();
  const mailOptions = {
    from: `"SMMPLAN" <${config.user}>`,
    to: to,
    subject: 'Код подтверждения входа (Админ-панель)',
    text: `Ваш код подтверждения: ${code}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
        <h2 style="color: #333;">Вход в админ-панель</h2>
        <p>Используйте этот код для подтверждения входа:</p>
        <div style="font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #666; font-size: 12px;">Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
      </div>
    `,
  };

  try {
    const transport = await getTransporter();
    const info = await transport.sendMail(mailOptions);
    console.log('✅ Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error };
  }
}

/**
 * Отправляет данные для входа новому пользователю
 */
export async function sendCredentialsEmail(to: string, password: string) {
  const config = await ConfigService.getSmtpConfig();
  const mailOptions = {
    from: `"SMMPLAN" <${config.user}>`,
    to: to,
    subject: 'Ваши данные для входа в SMMPlan',
    text: `Добро пожаловать! Ваш пароль для входа: ${password}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
        <h2 style="color: #3b82f6;">Добро пожаловать в SMMPlan!</h2>
        <p>Ваш заказ принят. Мы автоматически создали для вас аккаунт, чтобы вы могли отслеживать статус заказа.</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: bold; uppercase;">Ваш логин:</p>
          <p style="margin: 5px 0 15px 0; font-weight: bold;">${to}</p>
          <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: bold; uppercase;">Ваш временный пароль:</p>
          <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 18px; color: #1e293b; font-weight: bold;">${password}</p>
        </div>
        <p style="font-size: 13px; color: #666;">Рекомендуем сменить пароль в личном кабинете после входа.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <a href="${ConfigService.getSystemConfig().appUrl}/login" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Войти в кабинет</a>
      </div>
    `,
  };

  try {
    const transport = await getTransporter();
    const info = await transport.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending credentials email:', error);
    return { success: false, error };
  }
}

/**
 * Отправляет данные для входа пользователю, созданному администратором
 */
export async function sendAdminCreatedUserEmail(to: string, password: string, username: string) {
  const config = await ConfigService.getSmtpConfig();
  const mailOptions = {
    from: `"SMMPLAN Admin" <${config.user}>`,
    to: to,
    subject: 'Добро пожаловать в SMMPlan',
    text: `Ваш аккаунт создан. Логин: ${username}, Пароль: ${password}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
        <h2 style="color: #3b82f6;">Добро пожаловать в SMMPlan!</h2>
        <p>Администратор создал для вас учетную запись.</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: bold; uppercase;">Ваш логин:</p>
          <p style="margin: 5px 0 15px 0; font-weight: bold;">${username}</p>
          <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: bold; uppercase;">Ваш временный пароль:</p>
          <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 18px; color: #1e293b; font-weight: bold;">${password}</p>
        </div>
        <p style="font-size: 13px; color: #666;">Рекомендуем сменить пароль в личном кабинете после входа.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <a href="${ConfigService.getSystemConfig().appUrl}/login" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Войти в кабинет</a>
      </div>
    `,
  };

  try {
    const transport = await getTransporter();
    const info = await transport.sendMail(mailOptions);
    console.log('✅ Welcome Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error };
  }
}

/**
 * Отправляет уведомление о смене пароля
 */
export async function sendPasswordUpdateEmail(to: string, password: string, username: string) {
  const config = await ConfigService.getSmtpConfig();
  const mailOptions = {
    from: `"SMMPLAN Support" <${config.user}>`,
    to: to,
    subject: 'Обновление данных входа SMMPlan',
    text: `Ваш пароль был изменен администратором. Новый пароль: ${password}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
        <h2 style="color: #3b82f6;">Пароль изменен</h2>
        <p>Администратор обновил данные вашего аккаунта.</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: bold; uppercase;">Ваш логин:</p>
          <p style="margin: 5px 0 15px 0; font-weight: bold;">${username}</p>
          <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: bold; uppercase;">Новый пароль:</p>
          <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 18px; color: #1e293b; font-weight: bold;">${password}</p>
        </div>
        <p style="font-size: 13px; color: #666;">Если вы не запрашивали эти изменения, пожалуйста, свяжитесь с поддержкой.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <a href="${ConfigService.getSystemConfig().appUrl}/login" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Войти в кабинет</a>
      </div>
    `,
  };

  try {
    const transport = await getTransporter();
    const info = await transport.sendMail(mailOptions);
    console.log('✅ Password Update Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password update email:', error);
    return { success: false, error };
  }
}

/**
 * Отправляет код для сброса пароля
 */
export async function sendPasswordResetEmail(to: string, code: string) {
  const config = await ConfigService.getSmtpConfig();
  const mailOptions = {
    from: `"SMMPLAN Support" <${config.user}>`,
    to: to,
    subject: 'Сброс пароля (Админ-панель)',
    text: `Ваш код для сброса пароля: ${code}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
        <h2 style="color: #ef4444;">Сброс пароля</h2>
        <p>Вы запрашивали сброс пароля от панели администратора SMMPlan.</p>
        <p>Используйте этот код для установки нового пароля:</p>
        <div style="font-size: 32px; font-weight: bold; color: #ef4444; letter-spacing: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #666; font-size: 12px;">Код действителен в течение 10 минут. Если вы не запрашивали сброс, просто проигнорируйте это письмо.</p>
      </div>
    `,
  };

  try {
    const transport = await getTransporter();
    const info = await transport.sendMail(mailOptions);
    console.log('✅ Password Reset Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return { success: false, error };
  }
}



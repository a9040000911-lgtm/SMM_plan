const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/services/mail.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

const newFn = `
/**
 * Отправляет код для сброса пароля
 */
export async function sendPasswordResetEmail(to: string, code: string) {
  const config = await ConfigService.getSmtpConfig();
  const mailOptions = {
    from: \`"SMMPLAN Support" <\${config.user}>\`,
    to: to,
    subject: 'Сброс пароля (Админ-панель)',
    text: \`Ваш код для сброса пароля: \${code}\`,
    html: \`
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
        <h2 style="color: #ef4444;">Сброс пароля</h2>
        <p>Вы запрашивали сброс пароля от панели администратора SMMPlan.</p>
        <p>Используйте этот код для установки нового пароля:</p>
        <div style="font-size: 32px; font-weight: bold; color: #ef4444; letter-spacing: 5px; margin: 20px 0;">
          \${code}
        </div>
        <p style="color: #666; font-size: 12px;">Код действителен в течение 10 минут. Если вы не запрашивали сброс, просто проигнорируйте это письмо.</p>
      </div>
    \`,
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
`;

if (!content.includes('export async function sendPasswordResetEmail')) {
    fs.appendFileSync(filePath, newFn);
    console.log('✅ Success: Appended sendPasswordResetEmail to mail.service.ts');
} else {
    console.log('ℹ️ Notice: sendPasswordResetEmail already exists in mail.service.ts');
}

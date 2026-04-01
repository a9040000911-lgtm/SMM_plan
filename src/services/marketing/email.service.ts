/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

// import nodemailer from 'nodemailer'; // When real API is ready

export class EmailMarketingService {
    /**
     * Sends a welcome email to a newly registered B2B client.
     */
    static async sendWelcomeEmail(toEmail: string, username: string, projectId: string) {
        try {
            // Here you would connect to Resend or Nodemailer
            // const transporter = nodemailer.createTransport({...});
            
            const html = this.getWelcomeHtmlTemplate(username);

            // Mock Implementation (Stub for current phase)
            console.log(`[EMAIL.SERVICE] 🟢 Mocking Welcome Email to ${toEmail}...`);
            console.log(`[EMAIL.SERVICE] Subject: Добро пожаловать в Smmplan B2B`);
            console.log(`[EMAIL.SERVICE] HTML Size: ${html.length} bytes`);
            
            // await transporter.sendMail({
            //     from: '"Smmplan B2B" <hello@smmplan.com>',
            //     to: toEmail,
            //     subject: 'Добро пожаловать в новую эру трафика',
            //     html: html
            // });

            console.log(`[EMAIL.SERVICE] ✅ Welcome Email Sent Successfully (Mock)`);
            return true;
        } catch (error) {
            console.error('[EMAIL.SERVICE] Failed to send welcome email:', error);
            return false;
        }
    }

    private static getWelcomeHtmlTemplate(username: string): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; color: #0f172a; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
                .header { background: #2563eb; color: #ffffff; padding: 40px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
                .content { padding: 40px; }
                .btn { display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; margin-top: 20px; }
                .footer { padding: 40px; text-align: center; font-size: 13px; color: #64748b; background: #f1f5f9; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Smmplan B2B</h1>
                </div>
                <div class="content">
                    <p>Здравствуйте, <strong>${username}</strong>,</p>
                    <p>Ваша учетная запись успешно активирована. Добро пожаловать в панель премиального SMM-продвижения.</p>
                    
                    <h3 style="margin-top: 30px;">Что дальше?</h3>
                    <ul style="color: #475569; padding-left: 20px;">
                        <li><strong>Шаг 1:</strong> Пополните баланс любым удобным способом (Card, Crypto, ЮKassa).</li>
                        <li><strong>Шаг 2:</strong> Выберите услугу в каталоге.</li>
                        <li><strong>Шаг 3:</strong> Наблюдайте за результатом в реальном времени.</li>
                    </ul>

                    <a href="https://smmtoolbox.ru/orders" class="btn">Перейти в панель управления</a>
                    
                    <p style="margin-top: 40px; border-left: 3px solid #cbd5e1; padding-left: 15px; color: #475569;">
                        <em>Поддержка всегда на связи. Если у вас крупный заказ, свяжитесь с нами для обсуждения индивидуальных тарифов и API интеграции.</em>
                    </p>
                </div>
                <div class="footer">
                    &copy; 2026 Smmplan. Advanced Traffic Architecture.<br>
                    Вы получили это письмо, потому что зарегистрировались на платформе.
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

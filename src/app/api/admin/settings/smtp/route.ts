import { NextRequest, NextResponse } from 'next/server';
import { ConfigService } from '@/services/core/config.service';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/services/core/jwt';
import nodemailer from 'nodemailer';

export async function GET(req: NextRequest) {
    try {
        const sessionStore = await cookies();
        const sessionToken = sessionStore.get('admin_session')?.value;
        if (!sessionToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const session = await verifyAdminSession(sessionToken);
        if (!session || (!session.isGlobalAdmin && session.role !== 'ADMIN')) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const smtp = await ConfigService.getSmtpConfig();
        
        // Hide actual password, just return masked representation
        return NextResponse.json({
            host: smtp.host,
            port: smtp.port,
            user: smtp.user,
            password: smtp.password ? '********' : ''
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const sessionStore = await cookies();
        const sessionToken = sessionStore.get('admin_session')?.value;
        if (!sessionToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const session = await verifyAdminSession(sessionToken);
        if (!session || (!session.isGlobalAdmin && session.role !== 'ADMIN')) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const body = await req.json();

        // Testing Connection before saving (or without saving)
        if (body.action === 'TEST') {
             try {
                // If the user sent a masked password, we should grab the real one from DB
                let testPassword = body.password;
                if (testPassword === '********') {
                    const currentConfig = await ConfigService.getSmtpConfig();
                    testPassword = currentConfig.password;
                }

                const transporter = nodemailer.createTransport({
                    host: body.host,
                    port: parseInt(body.port, 10),
                    secure: parseInt(body.port, 10) === 465,
                    auth: {
                        user: body.user,
                        pass: testPassword,
                    },
                });

                // Send test email to the currently logged-in admin (or body.user if no email in session)
                let testEmailTo = session.username;
                if (!testEmailTo.includes('@')) {
                    testEmailTo = body.user; // fallback if admin username is not an email
                }

                await transporter.sendMail({
                    from: `"SMMPLAN Test" <${body.user}>`,
                    to: testEmailTo,
                    subject: 'SMMPlan: Интеграция SMTP успешна',
                    html: `<b>Тестирование подключения прошло успешно. Учетные данные верны.</b>`
                });

                return NextResponse.json({ success: true, message: 'Тестовое письмо отправлено успешно' });
             } catch (testError: any) {
                console.error('[SMTP TEST ERROR]', testError);
                return NextResponse.json({ error: 'Ошибка подключения: ' + testError.message }, { status: 400 });
             }
        }

        // Action: SAVE
        const configToSave: { host: string; port: number; user: string; password?: string } = {
            host: body.host,
            port: parseInt(body.port, 10),
            user: body.user,
        };

        if (body.password && body.password !== '********') {
            configToSave.password = body.password;
        }

        await ConfigService.setSmtpConfig(configToSave);

        return NextResponse.json({ success: true, message: 'Настройки сохранены' });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

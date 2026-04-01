/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTelegramAuth, TelegramAuthData } from '@/utils/telegram';
import { getClientProjectId } from '@/utils/project-resolver';
import { signMagicToken } from '@/services/core/magic-auth';

/**
 * Handles Telegram Authorization Widget data.
 * POST /api/auth/telegram
 */
export async function POST(req: Request) {
    try {
        const body: TelegramAuthData = await req.json();
        const projectId = await getClientProjectId();

        const project = await prisma.project.findUnique({
            where: { id: projectId || 'default' },
            select: { botToken: true, id: true }
        });

        if (!project || !project.botToken) {
            return NextResponse.json({ success: false, error: 'Telegram Auth not configured for this project' }, { status: 400 });
        }

        // --- VERIFY HASH ---
        const isValid = verifyTelegramAuth(body, project.botToken);
        if (!isValid) {
            return NextResponse.json({ success: false, error: 'Invalid Telegram hash' }, { status: 403 });
        }

        // --- AUTH DATE CHECK (Anti-Replay) ---
        // Allow up to 1 hour difference
        const now = Math.floor(Date.now() / 1000);
        if (now - body.auth_date > 3600) {
            return NextResponse.json({ success: false, error: 'Auth data expired' }, { status: 403 });
        }

        // --- FIND OR CREATE USER ---
        const tgIdStr = body.id.toString();
        let user = await prisma.user.findFirst({
            where: { 
                tgId: BigInt(body.id),
                projectId: project.id
            }
        });

        if (!user) {
            // Check if user with same username exists? No, better use ID as source of truth
            // Link to existing user if invited? For now, just create new one
            user = await prisma.user.create({
                data: {
                    tgId: BigInt(body.id),
                    username: body.username || body.first_name || 'User',
                    projectId: project.id,
                }
            });
        }

        // --- GENERATE MAGIC TOKEN ---
        const token = await signMagicToken({
            userId: user.id,
            tgId: tgIdStr,
            projectId: project.id
        });

        return NextResponse.json({ 
            success: true, 
            token,
            user: {
                id: user.id,
                username: user.username
            }
        });

    } catch (e: any) {
        console.error('[TelegramAuth] Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

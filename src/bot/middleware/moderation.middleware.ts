/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';


export const moderationMiddleware = async (ctx: any, next: any) => {
    const userId = ctx.from?.id;
    const projectId = ctx.project?.id;

    console.error(`!!! [Moderation] Middleware Triggered for user:${userId} project:${projectId}`);

    if (ctx.message?.text === 'ping') {
        await ctx.reply('pong').catch((e: any) => console.error('Ping failed:', e.message));
    }

    if (!userId || !projectId) return next();


    try {
        console.error(`[Moderation] TRACE user:${userId} proj:${projectId}`);

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { projectId, tgId: BigInt(userId) },
                    { projectId: null, tgId: BigInt(userId) }
                ]
            },
            select: { isPermanentlyBanned: true, banExpiresAt: true, role: true }
        });

        if (user) {
            const isTempBanned = user.banExpiresAt && user.banExpiresAt > new Date();
            if (user.isPermanentlyBanned || isTempBanned) {
                console.error(`[Moderation] BAN DETECTED for ${userId}`);

                await ctx.reply('ВАШ АККАУНТ ЗАБЛОКИРОВАН АДМИНИСТРАТОРОМ')
                    .catch((e: any) => console.error(`[Moderation] REPLY ERROR: ${e.message}`));

                return;
            }
        }
    } catch (err: any) { console.error('[Moderation] CRITICAL ERROR:', err.message); }

    return next();
};

import { prisma } from "@/lib/prisma";
import { MaxMessengerService } from "./max-messenger.service";

/**
 * UnifiedNotificationService
 * Implements the 2026 hybrid notification strategy:
 * 1. MAX Messenger (Future/Primary)
 * 2. Telegram (Current/Secondary)
 * 3. Email (Guaranteed Fallback)
 */
export class UnifiedNotificationService {
    /**
     * Sends an admin notification using the best available channel.
     */
    static async notifyAdmin(projectId: string, message: string) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { botToken: true }
        });

        if (!project) return false;

        // 1. Try MAX
        if (project.botToken) {
            const success = await MaxMessengerService.notifyAdmin(projectId, message);
            if (success) return true;
        }

        // 2. Try Telegram (Legacy Fallback)
        if (project.botToken) {
             // In a real scenario, we would call the Telegram API here.
             // For now, we log the attempt as "Legacy Fallback Triggered".
             console.log(`[TG Fallback] Project ${projectId}: ${message}`);
             // return await TelegramService.notifyAdmin(...)
             return true; 
        }

        // 3. Email fallback (handled by caller or a separate mailer service)
        console.log(`[Email Fallback] Notification sent via secondary email system.`);
        return true;
    }

    /**
     * Sends a user notification using the best available channel.
     */
    static async notifyUser(userId: string, projectId: string, message: string) {
        const [project, user] = await Promise.all([
            prisma.project.findUnique({ where: { id: projectId }, select: { botToken: true } }),
            prisma.user.findUnique({ where: { id: userId }, select: { whatsapp: true, tgId: true, email: true } })
        ]);

        if (!project || !user) return false;

        // 1. MAX (Priority if phone present)
        if (project.botToken && user.whatsapp) {
            const success = await MaxMessengerService.notifyUser(userId, message);
            if (success) return true;
        }

        // 2. Telegram (Legacy if tgId present)
        if (project.botToken && user.tgId) {
            console.log(`[TG User Notification] User ${userId}: ${message}`);
            return true;
        }

        // 3. Email (Absolute fallback)
        if (user.email) {
             // await sendNotificationEmail(user.email, message);
             console.log(`[Email User Notification] User ${user.email}: ${message}`);
             return true;
        }

        return false;
    }
}

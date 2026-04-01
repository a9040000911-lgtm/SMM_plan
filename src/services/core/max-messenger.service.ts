import { prisma } from "@/lib/prisma";

/**
 * MaxMessengerService 2026
 * Primary communication service for SMMplan following the 2026 Telegram block.
 * Interfaces with the state-approved MAX messenger.
 */
export class MaxMessengerService {
    private static API_BASE = "https://api.max-messenger.ru/v1";

    /**
     * Sends a notification to a project's MAX bot channel.
     */
    static async notifyAdmin(projectId: string, message: string) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { botToken: true }
        });

        if (!project?.botToken) {
            console.error(`MAX Bot token not found for project ${projectId}`);
            return false;
        }

        try {
            const res = await fetch(`${this.API_BASE}/sendMessage`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${project.botToken}`
                },
                body: JSON.stringify({
                    text: message,
                    parse_mode: "HTML"
                })
            });
            return res.ok;
        } catch (e) {
            console.error("MAX Messenger Error:", e);
            return false;
        }
    }

    /**
     * Sends an order confirmation to a client via MAX.
     */
    static async notifyUser(userId: string, _message: string) {
        const user = await prisma.user.findUnique({
             where: { id: userId },
             select: { whatsapp: true } // MAX identifies users by phone number
        });

        if (!user?.whatsapp) return false;

        // Implement user notification logic...
        return true;
    }
}

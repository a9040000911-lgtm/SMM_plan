/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 */
import axios from 'axios';

export class NotificationService {
    private static BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    private static CHAT_ID = process.env.TELEGRAM_ALERT_CHAT_ID;

    /**
     * Sends an alert to the configured Telegram channel.
     */
    static async sendAlert(message: string) {
        if (!this.BOT_TOKEN || this.BOT_TOKEN === 'skip' || !this.CHAT_ID) {
            console.warn('Telegram alerts not configured. Message:', message);
            return;
        }

        try {
            const url = `https://api.telegram.org/bot${this.BOT_TOKEN}/sendMessage`;
            await axios.post(url, {
                chat_id: this.CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            });
            console.log('Telegram alert sent successfully.');
        } catch (error: any) {
            console.error('Failed to send Telegram alert:', error.response?.data || error.message);
        }
    }

    /**
     * Alert specifically for smart analyzer failures.
     */
    static async notifyAnalyzerFailure(details: {
        serviceName: string,
        platform: string,
        category: string,
        suggestedTarget: string
    }) {
        const message = `⚠️ <b>Smart Analyzer Alert</b>\n\n` +
            `Could not accurately detect Link Type for service:\n` +
            `• <b>Name:</b> ${details.serviceName}\n` +
            `• <b>Platform:</b> ${details.platform}\n` +
            `• <b>Category:</b> ${details.category}\n` +
            `• <b>Defaulted to:</b> ${details.suggestedTarget}\n\n` +
            `<i>Please add a new Link Type in the admin panel if needed.</i>`;

        await this.sendAlert(message);
    }
}

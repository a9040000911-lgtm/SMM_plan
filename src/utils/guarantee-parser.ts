/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export class GuaranteeParser {
    static parse(text: string): number {
        const lower = text.toLowerCase();

        // 1. Explicit "X Days" / "X Дней" patterns
        // "R30", "Refill 30", "30 Days", "30д", "гарантия 30 дней"
        const explicitDays = [
            /R(\d+)/i,
            /Refill (\d+)/i,
            /Refill: (\d+)/i,
            /(\d+) Days/i,
            /(\d+) Day/i,
            /(\d+) дней/i,
            /(\d+) дня/i,
            /гарантия (\d+)/i
        ];

        for (const regex of explicitDays) {
            const match = lower.match(regex);
            if (match && match[1]) {
                return parseInt(match[1]);
            }
        }

        // 2. Keyword based (Lifetime, Refill without days)
        if (lower.includes('lifetime') || lower.includes('вечная') || lower.includes('бессрочная')) {
            return 365;
        }

        if (lower.includes('refill') || lower.includes('гарантия') || lower.includes('восстановление')) {
            // "Refill" without explicit days usually implies 30 days standard in this industry
            return 30;
        }

        if (lower.includes('no refill') || lower.includes('без гарантии')) {
            return 0;
        }

        return 0; // Default: No guarantee detected
    }
}



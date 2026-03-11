/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

interface LoyaltyLevel {
    name: string;
    min: number;
    discount: number;
}

const LOYALTY_LEVELS: LoyaltyLevel[] = [
    { name: '🥉 BRONZE', min: 0, discount: 0 },
    { name: '🥈 SILVER', min: 5000, discount: 3 },
    { name: '🥇 GOLD', min: 15000, discount: 7 },
    { name: '💎 DIAMOND', min: 50000, discount: 10 },
];

export function getUserLoyalty(spent: number, isPioneer: boolean = false) {
    const level = [...LOYALTY_LEVELS].reverse().find(l => spent >= l.min) || LOYALTY_LEVELS[0];
    const nextLevel = LOYALTY_LEVELS.find(l => l.min > spent);

    return {
        level,
        nextLevel,
        totalDiscount: level.discount + (isPioneer ? 20 : 0)
    };
}

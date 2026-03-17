/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { MarkupRule } from '@/services/types';

export interface MarketerSettings {
    isSmartFragmentationEnabled?: boolean;
    isDripFeedDisabled?: boolean;
    isVipFailoverEnabled?: boolean;
}

export interface PricingRules {
    rules?: MarkupRule[];
}

export interface SafetySettings {
    minProfitMargin?: number;
    maxDailySpend?: number;
}

export interface LoyaltySettings {
    referralPercent?: number;
    welcomeBonus?: number;
    spendThresholds?: {
        amount: number;
        discount: number;
    }[];
}

export interface PaymentSettings {
    allowedProviders?: string[];
    minDeposit?: number;
}

import { z } from 'zod';

/**
 * Contract for updating user balance.
 */
export const UpdateUserBalanceContract = z.object({
    userId: z.string().min(1),
    amount: z.number().refine(n => n !== 0, 'Adjustment amount cannot be zero'),
    reason: z.string().optional(),
});

/**
 * Contract for updating user loyalty level.
 */
export const UpdateUserLoyaltyContract = z.object({
    userId: z.string().min(1),
    level: z.string(),
});

/**
 * Contract for user referral settings.
 */
export const UserReferralContract = z.object({
    userId: z.string().min(1),
    referralPercent: z.number().min(0).max(100),
    isReferralActive: z.boolean(),
});

/**
 * Contract for creating a new employee/staff member.
 */
export const CreateEmployeeContract = z.object({
    email: z.string().email(),
    username: z.string().min(3),
    password: z.string().min(6),
    role: z.string(),
    isGlobalAdmin: z.boolean().default(false),
    allowedTabs: z.array(z.string()).default([]),
    projectIds: z.array(z.string()).default([]),
});

/**
 * Contract for updating user profile.
 */
export const UpdateUserContract = z.object({
    username: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    role: z.string().optional(),
    referralPercent: z.number().min(0).max(100).optional(),
    isBanned: z.boolean().optional(),
    moderationNote: z.string().optional(),
    isGlobalAdmin: z.boolean().optional(),
    balance: z.number().optional(),
});

export type UpdateUserBalanceInput = z.infer<typeof UpdateUserBalanceContract>;
export type UpdateUserLoyaltyInput = z.infer<typeof UpdateUserLoyaltyContract>;
export type UserReferralInput = z.infer<typeof UserReferralContract>;
export type CreateEmployeeInput = z.infer<typeof CreateEmployeeContract>;
export type UpdateUserInput = z.infer<typeof UpdateUserContract>;



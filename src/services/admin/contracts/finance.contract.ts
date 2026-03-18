import { z } from 'zod';

/**
 * Contract for creating a new business expense.
 */
export const CreateExpenseContract = z.object({
    category: z.string().min(1, "Category is required"),
    amount: z.number().positive("Amount must be positive"),
    description: z.string().min(5, "Description must be at least 5 characters"),
    date: z.date().or(z.string().transform(v => new Date(v))),
    projectId: z.string().nullable(),
});

/**
 * Contract for creating a promo code.
 */
export const CreatePromoCodeContract = z.object({
    code: z.string().min(3).toUpperCase(),
    discountPercent: z.number().min(0).max(100),
    description: z.string().optional(),
    projectId: z.string().nullable(),
});

/**
 * Filter contract for transactions.
 */
export const TransactionFilterContract = z.object({
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().default(100),
    search: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    projectId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseContract>;
export type CreatePromoCodeInput = z.infer<typeof CreatePromoCodeContract>;
export type TransactionFilterInput = z.infer<typeof TransactionFilterContract>;



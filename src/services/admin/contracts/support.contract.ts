import { z } from 'zod';

/**
 * Contract for updating internal support notes.
 */
export const UpdateSupportNotesContract = z.object({
    userId: z.string().min(1),
    notes: z.string(),
});

/**
 * Contract for creating a support template.
 */
export const CreateSupportTemplateContract = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
});

/**
 * Contract for creating a support macro.
 */
export const CreateSupportMacroContract = z.object({
    title: z.string().min(1, "Title is required"),
    text: z.string().min(1, "Text is required"),
    actions: z.array(z.object({
        type: z.enum(['GIVE_PROMOCODE', 'SEND_MESSAGE', 'REFUND_LAST_ORDER', 'ADD_BONUS', 'CLOSE_TICKET']),
        promoId: z.string().optional(),
        amount: z.number().optional(),
    })).default([]),
});

export type UpdateSupportNotesInput = z.infer<typeof UpdateSupportNotesContract>;
export type CreateSupportTemplateInput = z.infer<typeof CreateSupportTemplateContract>;
export type CreateSupportMacroInput = z.infer<typeof CreateSupportMacroContract>;

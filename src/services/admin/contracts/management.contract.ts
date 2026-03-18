import { z } from 'zod';

/**
 * Contract for updating project branding.
 */
export const UpdateProjectBrandingContract = z.object({
    projectId: z.string().min(1),
    name: z.string().min(2).optional(),
    brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    logoUrl: z.string().url().optional().or(z.literal('')),
});

/**
 * Contract for system settings update.
 */
export const UpdateSettingsContract = z.object({
    projectId: z.string().default('global'),
    key: z.string().min(1),
    value: z.string(),
});

/**
 * Contract for updating CMS strings.
 */
export const UpdateCmsStringsContract = z.object({
    projectId: z.string().min(1),
    updates: z.record(z.string()),
    pageSlug: z.string().optional(),
});

/**
 * Contract for updating CMS blocks.
 */
export const UpdateCmsBlocksContract = z.object({
    projectId: z.string().min(1),
    pageSlug: z.string().min(1),
    blocks: z.array(z.object({
        id: z.string().optional(),
        type: z.string(),
        slot: z.string().default('DEFAULT'),
        data: z.any(),
    })),
});

/**
 * Contract for creating news.
 */
export const CreateNewsContract = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    imageUrl: z.string().url().optional().or(z.literal('')),
    projectId: z.string().optional().nullable(),
});

/**
 * Contract for updating global settings.
 */
export const UpdateGlobalSettingsContract = z.object({
    settings: z.record(z.string()),
});

export type UpdateProjectBrandingInput = z.infer<typeof UpdateProjectBrandingContract>;
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsContract>;
export type UpdateCmsStringsInput = z.infer<typeof UpdateCmsStringsContract>;
export type UpdateCmsBlocksInput = z.infer<typeof UpdateCmsBlocksContract>;
export type CreateNewsInput = z.infer<typeof CreateNewsContract>;
export type UpdateGlobalSettingsInput = z.infer<typeof UpdateGlobalSettingsContract>;



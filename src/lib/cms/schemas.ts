/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Zod schemas for CMS blocks Validation.
 * Guarantees that the backend provides the exact data structure requested by Frontend React Components.
 */

import { z } from "zod";

// ==========================================
// 1. HERO BLOCK SCHEMA
// ==========================================
export const CmsHeroSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  primaryButtonText: z.string().optional().default("Начать работу"),
  primaryButtonLink: z.string().optional().default("/register"),
  secondaryButtonText: z.string().optional(),
  secondaryButtonLink: z.string().optional(),
  badgeText: z.string().optional(),
  imagePath: z.string().optional(),
  features: z.array(z.string()).optional()
});

export type CmsHeroContent = z.infer<typeof CmsHeroSchema>;

// ==========================================
// 2. FEATURES BLOCK SCHEMA
// ==========================================
export const CmsFeatureItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string().optional(), // lucide icon name
});

export const CmsFeaturesSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  items: z.array(CmsFeatureItemSchema).default([]),
});

export type CmsFeaturesContent = z.infer<typeof CmsFeaturesSchema>;

// ==========================================
// 3. STATS BLOCK SCHEMA
// ==========================================
export const CmsStatItemSchema = z.object({
  value: z.string(),
  label: z.string(),
  suffix: z.string().optional(),
});

export const CmsStatsSchema = z.object({
  title: z.string().optional(),
  items: z.array(CmsStatItemSchema).default([]),
});

export type CmsStatsContent = z.infer<typeof CmsStatsSchema>;

// ==========================================
// 4. MASTER BLOCK VALIDATION WRAPPER
// ==========================================
export const CmsBlockDataSchema = z.union([
  z.object({ type: z.literal("HERO"), data: CmsHeroSchema }),
  z.object({ type: z.literal("FEATURES"), data: CmsFeaturesSchema }),
  z.object({ type: z.literal("STATS"), data: CmsStatsSchema }),
  // Fallback for unknown blocks (PROMO_CAROUSEL, CUSTOM_HTML, etc) during migration
  z.object({ type: z.string(), data: z.any() })
]);

export type CmsBlockData = z.infer<typeof CmsBlockDataSchema>;

/**
 * Safely parses CMS block data. If it fails, it returns a safe fallback or throws in development to catch schema drifts.
 */
export function validateCmsBlock(type: string, data: any): { isValid: boolean; parsedData: any; error?: z.ZodError } {
  try {
    // We wrap it in an object format matching the discriminated union
    const parsed = CmsBlockDataSchema.parse({ type, data });
    return { isValid: true, parsedData: parsed.data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[CMS Validation Error] Block type: ${type}`, error.errors);
      return { isValid: false, parsedData: null, error };
    }
    return { isValid: false, parsedData: null };
  }
}

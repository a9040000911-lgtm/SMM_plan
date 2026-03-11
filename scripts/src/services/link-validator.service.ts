/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export class LinkValidatorService {
    /**
     * Validates a link against a specific LinkType rules stored in the database.
     */
    static async validate(link: string, targetType: string): Promise<ValidationResult> {
        const url = link.trim();
        if (!url) {
            return { isValid: false, error: 'Ссылка пустая' };
        }

        try {
            // Find the link type configuration by slug (targetType)
            const linkType = await prisma.linkType.findUnique({
                where: { slug: targetType }
            });

            if (!linkType || !linkType.validationPattern) {
                // If no dynamic rule, we fallback to a very basic URL check or allow it
                // For "CUSTOM" or unknown types, we just check if it's a URL-like string
                return this.basicValidation(url);
            }

            const regex = new RegExp(linkType.validationPattern, 'i');
            const isValid = regex.test(url);

            if (!isValid) {
                return {
                    isValid: false,
                    error: linkType.errorMessage || `Некорректный формат ссылки для типа "${linkType.name}"`
                };
            }

            return { isValid: true };
        } catch (error: any) {
            console.error('Validation error:', error);
            // On DB error, fallback to basic validation to not block orders
            return this.basicValidation(url);
        }
    }

    private static basicValidation(url: string): ValidationResult {
        const isUrl = url.startsWith('http://') || url.startsWith('https://') || url.includes('.');
        return isUrl
            ? { isValid: true }
            : { isValid: false, error: 'Введите корректную ссылку' };
    }

    /**
     * Get example link for a target type to show to the user.
     */
    static async getExample(targetType: string): Promise<string | null> {
        const linkType = await prisma.linkType.findUnique({
            where: { slug: targetType }
        });
        return linkType?.example || null;
    }
}

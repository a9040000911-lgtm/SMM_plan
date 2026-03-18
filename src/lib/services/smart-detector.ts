/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Platform, Category } from '@/generated/client';
import { SmartAnalyzerLogic } from '@/services/providers/smart-analyzer.logic';

/**
 * @deprecated Use SmartAnalyzerService.analyzeService directly.
 * Kept for backward compatibility with existing Client Components.
 */
export interface DetectionResult {
    platform: Platform;
    category: Category;
    targetType: string;
    isPrivate: boolean;
    description: string;
    suggestedName?: string;
}

/**
 * Detects service details using the consolidated SmartAnalyzerService.
 */
export function detectServiceDetails(name: string, description: string = '', categoryInput: string = ''): DetectionResult {
    const result = SmartAnalyzerLogic.detectSync(name, description, categoryInput);

    return {
        platform: result.platform,
        category: result.category,
        targetType: result.targetType,
        isPrivate: result.isPrivate,
        description: result.description_ru,
        suggestedName: result.suggestedName
    };
}



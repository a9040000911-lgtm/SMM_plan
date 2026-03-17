/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 */
import { prisma } from '@/lib/prisma';
import { Platform, Category, InternalService } from '@prisma/client';
import { SmartAnalyzerLogic } from './smart-analyzer.logic';

export interface MappingSuggestion {
    internalService: InternalService;
    confidence: number; // 0 to 1
    reason: string;
}

export class SmartMappingService {
    /**
     * Finds the best matching internal services for a provider service.
     */
    static async findMatches(
        providerServiceName: string,
        platform: Platform,
        category: Category,
        limit: number = 3
    ): Promise<MappingSuggestion[]> {
        // 1. Fetch all active internal services for the same platform and category
        const internals = await prisma.internalService.findMany({
            where: {
                platform,
                category,
                isActive: true,
            },
        });

        if (internals.length === 0) return [];

        const suggestions: MappingSuggestion[] = [];
        const normalizedProviderName = this.normalizeName(providerServiceName);

        for (const internal of internals) {
            const normalizedInternalName = this.normalizeName(internal.name);
            const score = this.calculateSimilarity(normalizedProviderName, normalizedInternalName);

            if (score > 0.4) { // Minimum threshold to even consider
                suggestions.push({
                    internalService: internal,
                    confidence: score,
                    reason: this.getReason(score),
                });
            }
        }

        // Sort by confidence descending
        return suggestions
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, limit);
    }

    /**
     * Simple string normalization for better matching.
     */
    private static normalizeName(name: string): string {
        return name
            .toLowerCase()
            .replace(/\[.*?\]/g, '') // Remove brackets
            .replace(/[^a-zа-я0-9\s]/g, '') // Remove special chars
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
    }

    /**
     * Jaro-Winkler distance implementation for fuzzy string matching.
     */
    private static calculateSimilarity(s1: string, s2: string): number {
        if (s1 === s2) return 1.0;
        if (s1.length === 0 || s2.length === 0) return 0.0;

        const maxDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
        const matches1 = new Array(s1.length).fill(false);
        const matches2 = new Array(s2.length).fill(false);

        let matches = 0;
        for (let i = 0; i < s1.length; i++) {
            const start = Math.max(0, i - maxDistance);
            const end = Math.min(i + maxDistance + 1, s2.length);
            for (let j = start; j < end; j++) {
                if (matches2[j]) continue;
                if (s1[i] === s2[j]) {
                    matches1[i] = true;
                    matches2[j] = true;
                    matches++;
                    break;
                }
            }
        }

        if (matches === 0) return 0.0;

        let transpositions = 0;
        let k = 0;
        for (let i = 0; i < s1.length; i++) {
            if (!matches1[i]) continue;
            while (!matches2[k]) k++;
            if (s1[i] !== s2[k]) transpositions++;
            k++;
        }

        const jaro = (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;
        
        // Winkler adjustment
        const prefixLength = 4;
        let p = 0;
        for (let i = 0; i < Math.min(prefixLength, s1.length, s2.length); i++) {
            if (s1[i] === s2[i]) p++;
            else break;
        }

        return jaro + p * 0.1 * (1 - jaro);
    }

    private static getReason(score: number): string {
        if (score > 0.9) return 'Высокая степень совпадения названий';
        if (score > 0.7) return 'Похожее название и параметры';
        if (score > 0.5) return 'Частичное совпадение ключевых слов';
        return 'Низкая уверенность';
    }
}

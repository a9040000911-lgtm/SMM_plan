import { IntelligencePlatform } from '../common/entities';
import { CATEGORY_MAPPINGS } from '../kb/category-mapper';

export interface IntelligenceMappingResult {
    category: string;
    confidence: number;
    flags: string[];
}

export class IntelligenceServiceMapper {
    map(platform: IntelligencePlatform, name: string, description: string = ''): IntelligenceMappingResult {
        const text = `${name} ${description}`.toLowerCase();
        let bestCategory = 'UNCATEGORIZED';
        let maxScore = 0;
        const activeFlags: string[] = [];

        const platformMappings = CATEGORY_MAPPINGS[platform] || [];

        for (const mapping of platformMappings) {
            let score = 0;
            mapping.keywords.forEach(kw => {
                if (text.includes(kw.toLowerCase())) score += 100;
            });
            mapping.triggers?.forEach(tr => {
                if (text.includes(tr.toLowerCase())) score += 50;
            });

            if (score > maxScore) {
                maxScore = score;
                bestCategory = mapping.category;
            }
        }

        const premiumLabels = ['hq', 'uhq', 'vhq', 'real', 'ads', 'high quality', 'non-drop', 'rst™', 'awv™'];
        premiumLabels.forEach(label => {
            if (text.includes(label)) {
                maxScore += 25;
                if (!activeFlags.includes('PREMIUM')) activeFlags.push('PREMIUM');
            }
        });

        if (text.includes('stable') || text.includes('no drop')) {
            activeFlags.push('HIGH_STABILITY');
        }

        return {
            category: bestCategory,
            confidence: Math.min(maxScore / 300, 1.0),
            flags: activeFlags
        };
    }
}



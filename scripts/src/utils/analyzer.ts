/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { analyzeLink as modularAnalyzeLink, AnalysisResult as ModularAnalysisResult } from './link-analyzer';

export { type TargetType, type AnalysisResult } from './link-analyzer/types';

// Delegate to modular Link Analyzer.
/**
 * Оставлено для обратной совместимости. Использует новую модульную систему.
 */
export function analyzeLink(link: string): ModularAnalysisResult | null {
  return modularAnalyzeLink(link);
}

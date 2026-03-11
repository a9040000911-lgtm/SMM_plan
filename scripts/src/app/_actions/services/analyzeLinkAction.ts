"use server";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { analyzeLink as internalAnalyzeLink } from "@/utils/link-analyzer";

export async function analyzeLinkAction(link: string) {
    try {
        const result = internalAnalyzeLink(link);

        if (!result) return { success: false, error: "Cloud not analyze link" };

        return {
            success: true,
            data: {
                platform: result.platform,
                objectType: result.objectType,
                possibleCategories: result.possibleCategories,
                isPrivate: result.isPrivate,
                isAlbum: result.isAlbum,
                isComment: result.isComment
            }
        };
    } catch (error) {
        console.error("Link analysis action error:", error);
        return { success: false, error: "An error occurred during link analysis" };
    }
}

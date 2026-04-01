/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { projectId, rating, text, userName, isAnonymous } = body;

        if (!rating || !text) {
            return NextResponse.json({ message: "Rating and text are required" }, { status: 400 });
        }

        const session = await auth();

        const { ReviewService } = await import("@/services/cms/review.service");
        const result = await ReviewService.createReview({
            projectId,
            userId: session?.user ? (session.user as any).id : undefined,
            rating,
            text,
            userName,
            isAnonymous
        });

        if (!result.success) {
            throw new Error(result.error?.message || "Failed to create review");
        }

        return NextResponse.json({ success: true, id: result.data.id });

    } catch (error: any) {
        console.error("[Reviews API Error]:", error);
        return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
    }
}



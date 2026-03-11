/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { projectId, rating, text, userName, isAnonymous } = body;

        if (!rating || !text) {
            return NextResponse.json({ message: "Rating and text are required" }, { status: 400 });
        }

        const session = await auth();

        // Find or create a placeholder user for anonymous/guest reviews if no session
        let userId: string;
        if (session?.user && (session.user as any).id) {
            userId = (session.user as any).id;
        } else {
            console.log("[Reviews API] Authenticated session not found, using guest user");
            // Find a system user for guests or use a default one
            let guestUser = await prisma.user.findFirst({
                where: { email: 'guest@smmplan.ru' }
            });

            if (!guestUser) {
                console.log("[Reviews API] Creating guest user placeholder");
                // Create guest user if doesn't exist
                guestUser = await prisma.user.create({
                    data: {
                        email: 'guest@smmplan.ru',
                        username: 'guest',
                        role: 'USER'
                    }
                });
            }
            userId = guestUser.id;
        }

        console.log("[Reviews API] Creating review for user:", userId, "on project:", projectId);

        const review = await prisma.review.create({
            data: {
                projectId: projectId || undefined,
                userId,
                rating: Number(rating),
                text,
                userName: userName || null,
                isAnonymous: !!isAnonymous,
                status: 'PENDING',
            }
        });

        return NextResponse.json({ success: true, id: review.id });

    } catch (error: any) {
        console.error("[Reviews API Error]:", error);
        return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
    }
}

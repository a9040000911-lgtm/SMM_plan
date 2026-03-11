/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DripFeedService } from "@/services/orders/drip-feed.service";
import { getAdminSession } from "@/utils/admin-session";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Correct params typing for Next 15
) {
    try {
        const session = await getAdminSession();
        if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Resolving params
        const resolvedParams = await params;
        const id = resolvedParams.id;

        const order = await prisma.order.findUnique({
            where: { id: parseInt(id) }
        });

        if (!order) {
            return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
        }

        // Force run logic
        // We manually trigger the service
        // We don't check schedule here, because it's FORCE run.

        // processRun expects first argument as orderId string, NOT object.
        // Based on view_file output: static async processRun(orderId: string)
        await DripFeedService.processRun(order.id);

        return NextResponse.json({ success: true, message: "Drip Run initiated manually" });

    } catch (error: any) {
        console.error("Force run error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

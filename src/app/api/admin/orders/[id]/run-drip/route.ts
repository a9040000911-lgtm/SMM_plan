/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/utils/admin-session";
import { prisma } from '@/lib/prisma';

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

        const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        if (!session.isGlobalAdmin && !session.allowedProjects.includes(order.projectId || '')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { OrderProcessor } = await import("@/services/orders/order-processor.service");
        // We trigger the service
        await OrderProcessor.processDripFeedRun(parseInt(id));

        return NextResponse.json({ success: true, message: "Drip Run initiated manually" });

    } catch (error: any) {
        console.error("Force run error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

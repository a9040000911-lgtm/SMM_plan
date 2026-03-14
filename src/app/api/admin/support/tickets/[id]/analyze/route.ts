/**
 * (c) 2026 Smmplan. All rights reserved.
 * AI Analysis API for Support Tickets
 */
import { NextRequest, NextResponse } from 'next/server';
import { SupportAnalysisService } from '@/services/ai/support-analysis.service';
import { getAdminSession } from '@/utils/admin-session';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getAdminSession();
    
    // Check for admin/staff access
    if (!session || (session.role !== 'ADMIN' && session.role !== 'STAFF')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    try {
        const analysis = await SupportAnalysisService.analyzeTicket(id);
        return NextResponse.json({ success: true, analysis });
    } catch (e: any) {
        console.error('[API Support Analyze] Error:', e);
        return NextResponse.json({ 
            success: false, 
            error: e.message || 'Analysis failed' 
        }, { status: 500 });
    }
}

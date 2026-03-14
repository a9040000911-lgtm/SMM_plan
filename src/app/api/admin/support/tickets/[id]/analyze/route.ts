/**
 * (c) 2026 Smmplan. All rights reserved.
 * AI Analysis API for Support Tickets
 */
import { NextRequest, NextResponse } from 'next/server';
import { SupportAnalysisService } from '@/services/ai/support-analysis.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    
    // Check for admin/staff access
    if (!session || (session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'STAFF') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

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

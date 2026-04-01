/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getClientProjectId } from '@/utils/project-resolver';
import { CheckoutAuthService } from '@/services/core/checkout-auth.service';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

        const projectId = await getClientProjectId();
        if (!projectId) return NextResponse.json({ error: 'Project context missing' }, { status: 400 });

        const result = await CheckoutAuthService.sendVerificationCode(email, projectId);
        
        if (!result.success) {
            return NextResponse.json({ error: result.error || 'Failed to send code' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (_error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

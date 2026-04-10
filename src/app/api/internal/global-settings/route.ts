/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const internalKey = process.env.INTERNAL_API_KEY;
    if (internalKey && authHeader !== `Bearer ${internalKey}`) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const key = req.nextUrl.searchParams.get('key');
    if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 });

    const setting = await prisma.globalSetting.findUnique({
      where: { key }
    });

    return NextResponse.json({ value: setting?.value || null });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

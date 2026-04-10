/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { SmartAnalyzerService } from '@/services/providers';
import { getAdminSession } from '@/utils/admin-session';

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { names } = await req.json();
    if (!Array.isArray(names)) throw new Error('names must be an array');

    // Ограничиваем пакет до 10 штук за раз, чтобы не спамить API
    const batch = names.slice(0, 10);
    const results = await Promise.all(
      batch.map(async (name) => ({
        name,
        analysis: await SmartAnalyzerService.analyzeService(name)
      }))
    );

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



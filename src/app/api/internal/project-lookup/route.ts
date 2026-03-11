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
    const domain = req.nextUrl.searchParams.get('domain');
    if (!domain) return NextResponse.json({ error: 'Domain required' }, { status: 400 });

    console.log('[ProjectLookup] Searching for:', domain);
    const project = await prisma.project.findFirst({
      where: { domain },
      select: { id: true, slug: true, maintenanceMode: true }
    });

    if (!project) {
      console.log('[ProjectLookup] Domain not found, falling back to first project');
      const defaultProject = await prisma.project.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true, slug: true, maintenanceMode: true }
      });
      return NextResponse.json({ project: defaultProject });
    }

    console.log('[ProjectLookup] Found:', project.slug);

    return NextResponse.json({ project });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

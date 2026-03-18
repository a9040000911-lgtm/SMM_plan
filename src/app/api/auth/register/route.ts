/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getClientProjectId } from '@/utils/project-resolver';

export async function POST(req: NextRequest) {
  try {
    const { email, password, username } = await req.json();
    const projectId = await getClientProjectId();

    if (!projectId) {
      return NextResponse.json({ error: "Project context missing" }, { status: 400 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Проверяем, существует ли уже такой юзер В ЭТОМ ПРОЕКТЕ
    const existing = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        projectId: projectId
      }
    });

    if (existing) {
      return NextResponse.json({ error: "User already exists in this project" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        username: username || email.split('@')[0],
        projectId: projectId,
        balance: 0,
      }
    });

    // Promo Automation: Registration
    try {
      const { PromoService } = await import('@/services/users');
      await PromoService.processAutomationRules('REGISTRATION', { userId: user.id, value: 0, projectId: projectId });
    } catch (e) { console.error('Failed to process registration promo:', e); }

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, projectId: user.projectId }
    });

  } catch (error: any) {
    console.error("[Register Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}



/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from "@/auth";


import { getClientProjectId } from '@/utils/project-resolver';
import { LoyaltyService } from '@/services/users';

export async function GET(_req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const projectId = await getClientProjectId();

        if (!projectId) {
            return NextResponse.json({ error: "Project context missing" }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: {
                email: session.user.email,
                projectId: projectId
            },
            include: {
                _count: { select: { referrals: true } },
                project: { select: { botUsername: true } }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Loyalty Logic (Unified with Bot via LoyaltyService)
        const loyaltyInfo = await LoyaltyService.getLoyaltyInfo(user.id, user.spent.toNumber(), projectId);

        // Referral Settings
        const refPercent = await LoyaltyService.getReferralPercent(user.id, projectId);

        return NextResponse.json({
            id: user.id,
            email: user.email,
            username: user.username,
            balance: user.balance.toNumber(),
            spent: user.spent.toNumber(),
            role: user.role,
            loyalty: {
                ...loyaltyInfo.level,
                discount: loyaltyInfo.totalDiscount,
                isEarlyBird: loyaltyInfo.isEarlyBird,
                pioneerIndex: user.earlyBirdRank,
                nextLevel: loyaltyInfo.nextLevel
            },
            referrals: {
                count: user._count.referrals,
                earnings: user.referralEarnings.toNumber(),
                percent: refPercent
            },
            tgId: user.tgId?.toString() || null,
            botUsername: user.project?.botUsername || null,
            twoFactorEnabled: user.twoFactorEnabled,
            whatsapp: user.whatsapp,
            telegramContact: user.telegramContact,
            hasPassword: !!user.password
        });

    } catch (error) {
        console.error('[API Client User Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { currentPassword, newPassword, twoFactorEnabled, whatsapp, telegramContact, email } = await req.json();
        const projectId = await getClientProjectId();

        if (!projectId) {
            return NextResponse.json({ error: "Project context missing" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const data: any = {};

        // Case 1: Change/Set password
        if (newPassword) {
            const bcryptJs = await import('bcryptjs');

            // If user already has a password, we REQUIRE currentPassword to change it
            if (user.password) {
                if (!currentPassword) {
                    return NextResponse.json({ error: 'Требуется текущий пароль' }, { status: 400 });
                }
                const isMatch = await bcryptJs.compare(currentPassword, user.password);
                if (!isMatch) {
                    return NextResponse.json({ error: 'Неверный текущий пароль' }, { status: 400 });
                }
            }

            data.password = await bcryptJs.hash(newPassword, 10);
        }

        // Case 2: Set email (only if not set yet)
        if (email && !user.email) {
            // Check if email is already taken in this project
            const existing = await prisma.user.findFirst({
                where: { email, projectId }
            });
            if (existing) {
                return NextResponse.json({ error: 'Этот Email уже занят' }, { status: 400 });
            }
            data.email = email.toLowerCase().trim();
        }

        // Case 3: Toggle 2FA
        if (typeof twoFactorEnabled === 'boolean') {
            data.twoFactorEnabled = twoFactorEnabled;
        }

        // Case 4: Update contact info
        if (typeof whatsapp === 'string') {
            data.whatsapp = whatsapp;
        }
        if (typeof telegramContact === 'string') {
            data.telegramContact = telegramContact;
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: user.id },
            data
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[API Client User PATCH Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


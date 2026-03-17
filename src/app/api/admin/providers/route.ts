/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ProviderService } from '@/services/providers';
import { ServiceSyncService } from '@/services/providers/sync.service';
import { BalanceMonitorService } from '@/services/providers/balance-monitor.service';
import { getAdminSession } from '@/utils/admin-session';
import { sanitizeData } from '@/utils/service-sanitizer';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const providers = await prisma.provider.findMany({
      include: {
        _count: {
          select: { balanceLogs: true, services: true }
        }
      }
    });

    const providersWithStats = await Promise.all(providers.map(async (p) => {
      const lastBalance = await prisma.providerBalanceLog.findFirst({
        where: { providerId: p.id },
        orderBy: { createdAt: 'desc' }
      });

      return {
        ...p,
        balanceThreshold: p.balanceThreshold.toNumber(),
        currentBalance: lastBalance?.balance.toNumber() || 0,
        lastSync: lastBalance?.createdAt.toISOString() || null,
        serviceCount: p._count.services
      };
    }));

    return NextResponse.json(sanitizeData(providersWithStats));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, providerId, name, type, apiKey, apiUrl, isEnabled } = body;

    if (action === 'sync_all') {
      await ServiceSyncService.syncAllServices();
      await BalanceMonitorService.checkAndLogAllBalances();
      return NextResponse.json({ success: true });
    }

    if (action === 'sync_provider') {
      const provider = await prisma.provider.findUnique({ where: { id: providerId } });
      if (!provider) throw new Error('Provider not found');

      await ServiceSyncService.syncAllServices();
      return NextResponse.json({ success: true });
    }

    if (action === 'create') {
      const exists = await prisma.provider.findFirst({ where: { name } });
      if (exists) return NextResponse.json({ error: `Провайдер с именем ${name} уже существует` }, { status: 400 });

      const provider = await prisma.provider.create({
        data: {
          name,
          type: type || 'universal',
          apiKey,
          apiUrl,
          isEnabled: isEnabled ?? true,
          pricesCurrency: body.pricesCurrency || 'USD',
          balanceCurrency: body.balanceCurrency || 'USD'
        }
      });
      return NextResponse.json(sanitizeData(provider));
    }

    if (action === 'update') {
      const provider = await prisma.provider.update({
        where: { id: providerId },
        data: {
          name,
          type,
          apiKey,
          apiUrl,
          isEnabled,
          pricesCurrency: body.pricesCurrency,
          balanceCurrency: body.balanceCurrency
        }
      });
      return NextResponse.json(sanitizeData(provider));
    }

    if (action === 'delete') {
      await prisma.provider.delete({
        where: { id: providerId }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

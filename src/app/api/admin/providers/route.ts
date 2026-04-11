/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ServiceSyncService } from '@/services/providers/sync.service';
import { BalanceMonitorService } from '@/services/providers/balance-monitor.service';
import { getAdminSession } from '@/utils/admin-session';
import { sanitizeData } from '@/utils/service-sanitizer';
import { validateSafeUrl } from '@/utils/url-validator';

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
        id: p.id,
        name: p.name,
        type: p.type,
        apiUrl: p.apiUrl,
        hasApiKey: !!p.apiKey, // [SECURITY] Never expose actual API key
        isEnabled: p.isEnabled,
        pricesCurrency: p.pricesCurrency,
        balanceCurrency: p.balanceCurrency,
        balanceThreshold: p.balanceThreshold.toNumber(),
        currentBalance: lastBalance?.balance.toNumber() || 0,
        lastSync: lastBalance?.createdAt.toISOString() || null,
        serviceCount: p._count.services
      };
    }));

    return NextResponse.json(sanitizeData(providersWithStats));
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody = await req.json();

    // [SECURITY] Validate input with Zod schema (prevents __proto__ pollution, type coercion)
    const { providerActionSchema, safeParse } = await import('@/lib/schemas/api');
    const parsed = safeParse(providerActionSchema, rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const body = parsed.data!;
    const { action } = body;
    const providerId = 'providerId' in body ? body.providerId : undefined;
    const name = 'name' in body ? body.name : undefined;
    const type = 'type' in body ? body.type : undefined;
    const apiKey = 'apiKey' in body ? body.apiKey : undefined;
    const apiUrl = 'apiUrl' in body ? body.apiUrl : undefined;
    const isEnabled = 'isEnabled' in body ? body.isEnabled : undefined;

    // [SECURITY] Sync allowed for SUPPORT, mutations require ADMIN
    const isWriteAction = ['create', 'update', 'delete'].includes(action);
    if (isWriteAction && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only ADMIN can modify providers' }, { status: 403 });
    }

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

    const { CryptoService } = await import('@/services/core/crypto.service');

    if (action === 'create') {
      // [SECURITY] Validate provider API URL against SSRF
      if (apiUrl) validateSafeUrl(apiUrl, 'Provider API URL');

      const exists = await prisma.provider.findFirst({ where: { name: name! } });
      if (exists) return NextResponse.json({ error: `Провайдер с именем ${name} уже существует` }, { status: 400 });

      const provider = await prisma.provider.create({
        data: {
          name: name!,
          type: type || 'universal',
          apiKey: CryptoService.encrypt(apiKey!),
          apiUrl: apiUrl!,
          isEnabled: isEnabled ?? true,
          pricesCurrency: (body as any).pricesCurrency || 'USD',
          balanceCurrency: (body as any).balanceCurrency || 'USD'
        }
      });
      return NextResponse.json(sanitizeData(provider));
    }

    if (action === 'update') {
      // [SECURITY] Validate provider API URL against SSRF
      if (apiUrl) validateSafeUrl(apiUrl, 'Provider API URL');

      const existing = await prisma.provider.findUnique({ where: { id: providerId } });
      if (!existing) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

      const newApiKey = apiKey === '******' ? existing.apiKey : CryptoService.encrypt(apiKey!);

      const provider = await prisma.provider.update({
        where: { id: providerId },
        data: {
          name,
          type,
          apiKey: newApiKey,
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}




import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Platform, Category, ServiceType } from '@prisma/client';
import { CryptoService } from '@/services/core/crypto.service';

export async function GET() {
  // --- ENV/DB GUARD ---
  let isMockEnabled = process.env.MOCK_PROVIDER_ENABLED === 'true';
  const dbMockSetting = await prisma.globalSetting.findUnique({ where: { key: 'MOCK_PROVIDER_ENABLED' } });
  if (dbMockSetting?.value === 'true') isMockEnabled = true;

  if (!isMockEnabled) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  try {
    console.log('--- SEEDING INSTANT ORDER SERVICES + MOCK PROVIDER ---');

    // 1. Get or Create Project
    let project = await prisma.project.findFirst({
      where: { OR: [{ slug: 'smmplan' }, { domain: 'localhost:3000' }] }
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          name: 'Smmplan Local',
          slug: 'smmplan',
          domain: 'localhost:3000',
          brandColor: '#3b82f6',
        }
      });
    }

    // 2. Create Internal Services
    const servicesData = [
      {
        id: 'tg-subs-high',
        platform: Platform.TELEGRAM,
        category: Category.SUBSCRIBERS,
        name: 'Подписчики (Высокое качество)',
        description: 'Живые подписчики с гарантией 30 дней.',
        pricePer1000: 149.00,
        minQty: 10,
        maxQty: 50000,
        targetType: 'CHANNEL',
        geo: 'RU',
        isActive: true,
        type: ServiceType.REGULAR
      },
      {
        id: 'tg-subs-standard',
        platform: Platform.TELEGRAM,
        category: Category.SUBSCRIBERS,
        name: 'Подписчики (Стандарт)',
        description: 'Быстрый старт, низкая цена.',
        pricePer1000: 89.00,
        minQty: 100,
        maxQty: 100000,
        targetType: 'CHANNEL',
        geo: 'MIX',
        isActive: true,
        type: ServiceType.REGULAR
      },
      {
        id: 'tg-views-real-api',
        platform: Platform.TELEGRAM,
        category: Category.VIEWS,
        name: 'Просмотры (Real)',
        description: 'Просмотры на последний пост.',
        pricePer1000: 5.50,
        minQty: 500,
        maxQty: 1000000,
        targetType: 'POST',
        geo: 'GLOBAL',
        isActive: true,
        type: ServiceType.REGULAR
      }
    ];

    for (const s of servicesData) {
      await prisma.internalService.upsert({
        where: { id: s.id },
        update: s,
        create: s
      });
      
      await prisma.projectServiceOverride.upsert({
        where: { projectId_internalServiceId: { projectId: project.id, internalServiceId: s.id } },
        update: { isActive: true },
        create: { projectId: project.id, internalServiceId: s.id, isActive: true }
      });
    }

    // ========================================
    // 3. CREATE MOCK PROVIDER
    // ========================================
    const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.WEBAPP_URL || 'http://localhost:3000';
    const mockApiUrl = `${baseUrl}/api/dev/mock-provider`;
    const MOCK_PROVIDER_NAME = 'MockProvider-E2E';
    const MOCK_API_KEY = 'mock-test-key'; // Обычный ключ, мок принимает любой

    const encryptedKey = CryptoService.encrypt(MOCK_API_KEY);

    const mockProvider = await prisma.provider.upsert({
      where: { name: MOCK_PROVIDER_NAME },
      update: {
        apiUrl: mockApiUrl,
        apiKey: encryptedKey,
        isEnabled: true,
        type: 'perfect-panel',
        metadata: {
          method: 'POST',
          requestType: 'form',
          keyField: 'key',
          actionField: 'action',
          isMock: true,
          pricesCurrency: 'USD',
        }
      },
      create: {
        name: MOCK_PROVIDER_NAME,
        apiUrl: mockApiUrl,
        apiKey: encryptedKey,
        isEnabled: true,
        type: 'perfect-panel',
        pricesCurrency: 'USD',
        balanceCurrency: 'USD',
        metadata: {
          method: 'POST',
          requestType: 'form',
          keyField: 'key',
          actionField: 'action',
          isMock: true,
          pricesCurrency: 'USD',
        }
      }
    });

    // 4. Create ProviderService records for mock
    const mockProviderServices = [
      { externalId: '1001', name: 'Mock TG Subscribers HQ', rawPrice: 0.12, category: Category.SUBSCRIBERS, platform: Platform.TELEGRAM },
      { externalId: '1002', name: 'Mock TG Subscribers STD', rawPrice: 0.07, category: Category.SUBSCRIBERS, platform: Platform.TELEGRAM },
      { externalId: '1003', name: 'Mock TG Views', rawPrice: 0.004, category: Category.VIEWS, platform: Platform.TELEGRAM },
    ];

    const providerServiceIds: string[] = [];

    for (const ps of mockProviderServices) {
      const record = await prisma.providerService.upsert({
        where: { providerId_externalId: { providerId: mockProvider.id, externalId: ps.externalId } },
        update: {
          name: ps.name,
          rawPrice: ps.rawPrice,
          rawData: { service: ps.externalId, name: ps.name, rate: String(ps.rawPrice), min: '10', max: '100000' },
          isActive: true,
          lastSeenAt: new Date(),
          dataHash: `mock-${ps.externalId}`,
        },
        create: {
          providerId: mockProvider.id,
          externalId: ps.externalId,
          name: ps.name,
          rawPrice: ps.rawPrice,
          rawData: { service: ps.externalId, name: ps.name, rate: String(ps.rawPrice), min: '10', max: '100000' },
          category: ps.category,
          platform: ps.platform,
          dataHash: `mock-${ps.externalId}`,
          isActive: true,
        }
      });
      providerServiceIds.push(record.id);
    }

    // 5. Create Mappings: Internal Service → Mock Provider Service
    const mappingPairs = [
      { internalId: 'tg-subs-high',     providerServiceIdx: 0 },
      { internalId: 'tg-subs-standard', providerServiceIdx: 1 },
      { internalId: 'tg-views-real-api', providerServiceIdx: 2 },
    ];

    for (const pair of mappingPairs) {
      const providerServiceId = providerServiceIds[pair.providerServiceIdx];
      await prisma.internalServiceMapping.upsert({
        where: {
          projectId_internalServiceId_providerId: {
            projectId: project.id,
            internalServiceId: pair.internalId,
            providerId: mockProvider.id,
          }
        },
        update: {
          providerServiceId,
          isActive: true,
          priority: 1,
        },
        create: {
          projectId: project.id,
          internalServiceId: pair.internalId,
          providerId: mockProvider.id,
          providerServiceId,
          isActive: true,
          priority: 1,
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Seeding complete: services + mock provider wired',
      mockProvider: {
        id: mockProvider.id,
        name: MOCK_PROVIDER_NAME,
        apiUrl: mockApiUrl,
        servicesCreated: mockProviderServices.length,
        mappingsCreated: mappingPairs.length,
      }
    });
  } catch (error: any) {
    console.error('[Seed] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeLink } from '@/utils/normalizer';
import { LinkService } from '@/services/providers';
import { getLinkTips } from '@/utils/tips';
import { getClientProjectId } from '@/utils/project-resolver';
import { validateProjectTMAData } from '@/utils/tma-auth';

export async function POST(req: NextRequest) {
  try {
    const projectId = await getClientProjectId();
    console.log(`[API Analyze] Resolving for Project ID: ${projectId}`);

    // 1. АВТОРИЗАЦИЯ
    const isDev = process.env.NODE_ENV === 'development';
    const authHeader = req.headers.get('Authorization');

    // Разрешаем гостевой доступ для публичной страницы анализа

    // Но если токен есть, проверяем его для TMA
    if (authHeader && authHeader.startsWith('tma ')) {
      const auth = await validateProjectTMAData(req);
      if (!auth.isValid) {
        // Если токен инвалидный, но прислан - это подозрительно, но для анализа можем пропустить или залогировать
        console.warn('[API Analyze] Invalid TMA token provided');
      }
    }

    // 2. АНАЛИЗ ССЫЛКИ
    const { link } = await req.json();
    if (!link) return NextResponse.json({ error: 'Link required' }, { status: 400 });

    const normalized = normalizeLink(link);
    const analysis = LinkService.analyze(normalized);

    if (!analysis) {
      return NextResponse.json({ error: 'Platform not supported' }, { status: 422 });
    }

    const targetTypes = LinkService.getCompatibleTypes(analysis.targetType);

    // 3. ПОДБОР УСЛУГ
    let services = [];
    try {
      services = await prisma.internalService.findMany({
        where: {
          platform: analysis.platform,
          isActive: true,
          OR: [
            { targetType: { in: targetTypes } },
            { allowedTargetTypes: { hasSome: targetTypes } }
          ],
          isPrivate: analysis.isPrivate ? undefined : false,
          category: analysis.possibleCategories?.length ? { in: analysis.possibleCategories } : undefined
        },
        orderBy: { pricePer1000: 'asc' }
      });
    } catch (dbError) {
      console.error('[API Analyze] Database query failed:', dbError);
      if (isDev) {
        console.warn('Database unavailable in Dev mode, returning RICH mock services');
        // Using plain numbers as mock - Prisma Decimal is only needed for DB
        services = [
          { id: 'mock-sub-1', name: 'Подписчики (Быстрые)', pricePer1000: 150, description: 'Быстрый старт, среднее качество', minQty: 100, maxQty: 10000, category: 'SUBSCRIBERS', targetType: 'CHANNEL' },
          { id: 'mock-sub-2', name: 'Подписчики (Живые РФ)', pricePer1000: 450, description: 'Живые пользователи, без списаний', minQty: 50, maxQty: 5000, category: 'SUBSCRIBERS', targetType: 'CHANNEL' },
          { id: 'mock-view-1', name: 'Просмотры (Мгновенные)', pricePer1000: 10, description: 'На последние 5 постов', minQty: 100, maxQty: 100000, category: 'VIEWS', targetType: 'POST' },
          { id: 'mock-like-1', name: 'Лайки (Микс)', pricePer1000: 50, description: 'Быстрые лайки на пост', minQty: 50, maxQty: 10000, category: 'LIKES', targetType: 'POST' },
          { id: 'mock-reac-1', name: 'Реакции (🔥)', pricePer1000: 30, description: 'Позитивные реакции', minQty: 10, maxQty: 2000, category: 'REACTIONS', targetType: 'POST' },
        ].map(s => ({ ...s, platform: 'TELEGRAM', isActive: true })) as any[];
      } else {
        throw dbError;
      }
    }

    // 4. ГРУППИРОВКА ПО КАТЕГОРИЯМ
    const primaryCategoriesMap: any = {};
    const upsellCategoriesMap: any = {};

    // Сортируем услуги: Сначала Кураторские -> Затем Цена
    const sortedServices = [...services].sort((a: any, b: any) => {
      if (a.isCurated && !b.isCurated) return -1;
      if (!a.isCurated && b.isCurated) return 1;
      return (Number(a.pricePer1000) || 0) - (Number(b.pricePer1000) || 0);
    });

    sortedServices.forEach(s => {
      const sData = {
        id: s.id,
        name: s.name,
        price: Number(s.pricePer1000),
        description: s.description,
        requirements: s.requirements,
        min: s.minQty,
        max: s.maxQty,
        platform: s.platform,
        category: s.category,
        targetType: s.targetType,
        isCurated: s.isCurated,
        rating: s.rating,
        avgCompletionTime: s.avgCompletionTime
      };

      const isPrimary = targetTypes.includes(s.targetType);

      if (isPrimary) {
        if (!primaryCategoriesMap[s.category]) primaryCategoriesMap[s.category] = [];
        if (primaryCategoriesMap[s.category].length < 10) {
          primaryCategoriesMap[s.category].push(sData);
        }
      }

      // Всегда предлагаем все остальные категории этой же платформы в качестве Upsell
      if (!upsellCategoriesMap[s.category]) upsellCategoriesMap[s.category] = [];
      if (upsellCategoriesMap[s.category].length < 3) {
        upsellCategoriesMap[s.category].push(sData);
      }
    });

    const categories = Object.entries(primaryCategoriesMap).map(([name, svcs]) => ({
      name,
      services: svcs
    }));

    // Умная сортировка Upsells на основе выбранной основной категории с обоснованием
    const RECOMMENDED_UPS_MAP: Record<string, string[]> = {
      'VIEWS': ['REACTIONS', 'LIKES', 'COMMENTS', 'REPOSTS'],
      'STREAMS': ['SUBSCRIBERS', 'VIEWS'],
      'SUBSCRIBERS': ['VIEWS', 'STREAMS', 'REACTIONS', 'BOOSTS'],
      'LIKES': ['COMMENTS', 'VIEWS', 'REPOSTS'],
      'REACTIONS': ['VIEWS', 'COMMENTS'],
    };

    const RECOMMENDED_REASONS: Record<string, Record<string, string>> = {
      'SUBSCRIBERS': {
        'VIEWS': 'Активность на постах делает приток подписчиков естественным и безопасным',
        'REACTIONS': 'Оживляет канал и повышает доверие новых участников',
        'BOOSTS': 'Разблокирует публикацию Stories и кастомные эмодзи для канала',
        'STREAMS': 'Зрители на стриме создают ажиотаж и быстрее подписываются',
        'LIKES': 'Лайки на посты подтверждают лояльность вашей аудитории'
      },
      'VIEWS': {
        'REACTIONS': 'Показывает реальную вовлеченность, а не просто "пустые" цифры',
        'COMMENTS': 'Живые обсуждения выводят контент в топ рекомендаций',
        'LIKES': 'Создает имидж вирального и востребованного контента',
        'REPOSTS': 'Увеличивает охват за счет распространения пользователями'
      },
      'STREAMS': {
        'SUBSCRIBERS': 'Конвертируйте зрителей в постоянное комьюнити прямо сейчас',
        'VIEWS': 'Доп. просмотры записи стрима помогут удержать охваты после эфира'
      },
      'LIKES': {
        'COMMENTS': 'Более ценный сигнал для алгоритмов, чем обычный лайк',
        'VIEWS': 'Для баланса активности: лайки без просмотров выглядят подозрительно',
        'REPOSTS': 'Помогает контенту выйти за пределы вашей текущей аудитории'
      },
      'REACTIONS': {
        'VIEWS': 'Соотношение просмотров и реакций напрямую влияет на рейтинг поста',
        'COMMENTS': 'Стимулирует реальных пользователей вступать в дискуссию'
      }
    };

    // Определяем "основную" категорию заказа (первую из списка) для подбора рекомендаций
    const mainCategory = categories[0]?.name || '';
    const recommendedForMain = RECOMMENDED_UPS_MAP[mainCategory] || [];
    const reasonsForMain = RECOMMENDED_REASONS[mainCategory] || {};

    const upsells = Object.entries(upsellCategoriesMap)
      .map(([name, svcs]) => {
        // Достаем услуги и добавляем бейджи
        const enrichedServices = (svcs as any[]).map((s: any) => {
          let badge = null;
          if (s.isCurated) badge = 'TOP';
          else if (s.rating >= 4.8) badge = 'Популярно';
          else if (s.avgCompletionTime < 60 && s.avgCompletionTime > 0) badge = 'Быстро';

          return { ...s, badge };
        });

        return {
          name,
          services: enrichedServices,
          reason: reasonsForMain[name] || '',
          priority: recommendedForMain.indexOf(name) !== -1 ? recommendedForMain.indexOf(name) : 999
        };
      })
      .sort((a, b) => a.priority - b.priority)
      .map(({ name, services, reason }) => ({ name, services, reason }));

    // 5. ПОЛУЧЕНИЕ СОВЕТОВ
    const tips = getLinkTips(analysis.platform, analysis.possibleCategories || [], analysis.objectType, analysis.isPrivate);

    return NextResponse.json({
      platform: analysis.platform,
      objectType: analysis.objectType,
      normalizedLink: normalized,
      categories,
      upsells, // Наш Smart Cross-Sell
      tips
    });

  } catch (error: any) {
    console.error('[API TMA Analyze Error]:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}



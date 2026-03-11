/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://smmplan.ru';

    // Static routes
    const routes = [
        '',
        '/catalog',
        '/faq',
        '/glossary',
        '/referrals',
        '/mass',
        '/docs/offer',
        '/docs/policy',
        '/docs/refund',
        '/docs/rules',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // In a real scenario, we would also fetch all public services/categories from DB:
    /*
    const categories = await prisma.serviceCategory.findMany({ where: { isActive: true } });
    const categoryRoutes = categories.map(cat => ({
      url: `${baseUrl}/catalog/${cat.slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
    */

    return [...routes];
}

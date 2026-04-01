import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';
import { getClientProjectId } from '@/utils/project-resolver';
import { getTenantDomain } from '@/lib/tenant/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const domain = await getTenantDomain();
    const baseUrl = `https://${domain}`;
    const projectId = await getClientProjectId();

    // Base Static Routes
    const routes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/catalog`,
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/buy`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
    ];

    if (!projectId) return routes;

    // Fetch Platforms for /buy/[platform]
    const platforms = await prisma.socialPlatform.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
    });

    platforms.forEach((platform) => {
        routes.push({
            url: `${baseUrl}/buy/${platform.slug.toLowerCase()}`,
            lastModified: platform.updatedAt,
            changeFrequency: 'weekly',
            priority: 0.8,
        });
    });

    // Fetch Service Categories for /buy/[platform]/[category]
    const categories = await prisma.serviceCategory.findMany({
        where: { isActive: true, projectId },
        select: { slug: true, name: true, updatedAt: true, socialPlatform: { select: { slug: true } } },
    });

    categories.forEach((cat) => {
        if (cat.socialPlatform?.slug) {
            routes.push({
                url: `${baseUrl}/buy/${cat.socialPlatform.slug.toLowerCase()}/${encodeURIComponent(cat.slug || cat.name.toLowerCase())}`,
                lastModified: cat.updatedAt,
                changeFrequency: 'weekly',
                priority: 0.7,
            });
        }
    });

    return routes;
}

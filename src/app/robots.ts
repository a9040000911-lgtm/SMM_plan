import { MetadataRoute } from 'next';
import { getTenantDomain } from '@/lib/tenant/server';

export default async function robots(): Promise<MetadataRoute.Robots> {
    const domain = await getTenantDomain();

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/login',
                '/register',
                '/admin/',
                '/api/',
                '/*?search=',    // Prevent crawling duplicated catalog searches
                '/*?platform=',  // Prevent crawling filtered query params
            ],
        },
        sitemap: `https://${domain}/sitemap.xml`,
    };
}

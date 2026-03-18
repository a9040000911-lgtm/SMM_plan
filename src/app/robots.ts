/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://smmplan.ru';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/dashboard/',
                    '/admin/',
                    '/login',
                    '/register',
                    '/cart',
                    '/*?serviceId=', // Prevent crawling filtered links in catalog
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}



/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { HomeContent } from "@/components/stitch/home/HomeContent";
import { Metadata } from "next";
import { getClientProjectId } from "@/utils/project-resolver";
import { CmsService } from "@/services/cms/cms.service";
import { toPlainObject } from "@/utils/serialization";

import { getTenantDomain, getTenantConfig } from "@/lib/tenant/server";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    const domain = await getTenantDomain();
    const config = await getTenantConfig();
    const scheme = domain === 'localhost' || domain.includes(':') ? 'http' : 'https';

    return {
        title: `${config.name} | Продвижение в соцсетях №1: Telegram, Instagram, VK, YouTube`,
        description: config.description || "Надежная платформа для быстрого продвижения в социальных сетях. Заказывайте подписчиков, лайки, просмотры и реакции в один клик с гарантией качества и моментальным стартом.",
        openGraph: {
            title: `${config.name} — Лучший SMM сервис для вашего бизнеса и блога`,
            description: config.description || "Эффективная раскрутка аккаунтов. Живая аудитория, стабильные просмотры и безопасные методы работы.",
        },
        alternates: {
            canonical: `${scheme}://${domain}`
        }
    };
}

export default async function HomePage() {
    let projectId: string | null = null;
    let cmsStrings: Record<string, string> = {};
    let cmsBlocks: any[] = [];
    let reviews: any[] = [];
    let projectConfig: any = null;

    let tenantDomain = 'smmplan.pro';
    let tenantName = 'Smmplan';
    let tenantScheme = 'https';

    try {
        projectId = await getClientProjectId();
        tenantDomain = await getTenantDomain();
        tenantScheme = tenantDomain === 'localhost' || tenantDomain.includes(':') ? 'http' : 'https';
        const configContext = await getTenantConfig();
        tenantName = configContext.name || 'Smmplan';

        // Fetch CMS content for the home page
        cmsStrings = await CmsService.getProjectStrings(projectId);
        cmsBlocks = await CmsService.getProjectBlocks(projectId);

        // Fetch only approved reviews for this project
        const reviewResult = await CmsService.getApprovedReviews(projectId);
        reviews = reviewResult.success ? reviewResult.data : [];

        if (projectId) {
            const { ProjectService } = await import("@/services/core");
            const project = await ProjectService.getById(projectId);
            if (project) {
                projectConfig = project.config;
            }
        }
    } catch (e) {
        console.error('[HomePage] Error fetching initial data:', e);
    }

    return (
        <div className="min-h-screen bg-white flex flex-col selection:bg-blue-600/10 selection:text-blue-600 relative overflow-x-hidden">
            {/* Minimal Background Aura */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.05)_0%,transparent_70%)] pointer-events-none" />

            <HomeContent 
                initialReviews={toPlainObject(reviews)} 
                projectId={projectId} 
                cmsContent={cmsStrings}
                cmsBlocks={cmsBlocks}
                projectConfig={projectConfig}
            />

            {/* Structured Data (JSON-LD) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "name": tenantName,
                        "url": `${tenantScheme}://${tenantDomain}`,
                        "potentialAction": {
                            "@type": "SearchAction",
                            "target": `${tenantScheme}://${tenantDomain}/catalog?search={search_term_string}`,
                            "query-input": "required name=search_term_string"
                        }
                    })
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": tenantName,
                        "url": `${tenantScheme}://${tenantDomain}`,
                        "logo": `${tenantScheme}://${tenantDomain}/logo.png`,
                        "sameAs": [] // Can be populated from tenant configuration later if needed
                    })
                }}
            />
        </div>
    );
}



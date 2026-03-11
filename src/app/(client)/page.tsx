/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { HomeContent } from "@/components/stitch/home/HomeContent";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getClientProjectId } from "@/utils/project-resolver";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Smmplan | Продвижение в соцсетях №1: Telegram, Instagram, VK, YouTube",
    description: "Надежная платформа для быстрого продвижения в социальных сетях. Заказывайте подписчиков, лайки, просмотры и реакции в один клик с гарантией качества и моментальным стартом.",
    openGraph: {
        title: "Smmplan — Лучший SMM сервис для вашего бизнеса и блога",
        description: "Эффективная раскрутка аккаунтов. Живая аудитория, стабильные просмотры и безопасные методы работы.",
    }
};

export default async function HomePage() {
    const projectId = await getClientProjectId();

    // Fetch only approved reviews for this project
    const reviews = await prisma.review.findMany({
        where: {
            projectId: projectId || undefined,
            status: 'APPROVED'
        },
        orderBy: { createdAt: 'desc' },
        take: 12
    });

    return (
        <div className="min-h-screen bg-white flex flex-col selection:bg-blue-600/10 selection:text-blue-600 relative overflow-x-hidden">
            {/* Minimal Background Aura */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.05)_0%,transparent_70%)] pointer-events-none" />

            <HomeContent initialReviews={JSON.parse(JSON.stringify(reviews))} projectId={projectId} />

            {/* Structured Data (JSON-LD) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "name": "Smmplan",
                        "url": "https://smmplan.ru",
                        "potentialAction": {
                            "@type": "SearchAction",
                            "target": "https://smmplan.ru/catalog?q={search_term_string}",
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
                        "name": "Smmplan",
                        "url": "https://smmplan.ru",
                        "logo": "https://smmplan.ru/logo.png",
                        "sameAs": [
                            "https://t.me/smmplan",
                            "https://vk.com/smmplan"
                        ]
                    })
                }}
            />
        </div>
    );
}

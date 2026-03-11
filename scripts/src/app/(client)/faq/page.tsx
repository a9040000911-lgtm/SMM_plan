/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { FaqContent, FAQ_JSON_LD } from "@/components/stitch/faq/FaqContent";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "FAQ — Ответы на вопросы по продвижению | Smmplan",
    description: "Узнайте всё о том, как работает Smmplan: безопасность аккаунтов, способы оплаты, сроки запуска заказов и гарантии качества. Ответы на самые частые вопросы пользователей.",
    openGraph: {
        title: "Часто задаваемые вопросы | Помощь Smmplan",
        description: "Безопасное продвижение, гарантия качества и поддержка 24/7. Мы ответим на все ваши вопросы.",
    }
};

export default function FaqPage() {
    return (
        <div className="min-h-screen bg-white">
            <FaqContent />

            {/* FAQ Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": FAQ_JSON_LD
                    })
                }}
            />
        </div>
    );
}

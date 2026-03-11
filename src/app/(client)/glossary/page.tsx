/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { GlossaryContent } from "@/components/stitch/glossary/GlossaryContent";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Словарь SMM терминов: Что такое накрутка, офферы и докрутка | Smmplan",
    description: "Подробный глоссарий SMM терминов. Узнайте значения популярных понятий: Drip-feed, Refill, ER, охват, показы и офферы. Обучайтесь и заказывайте продвижение профессионально.",
    openGraph: {
        title: "База знаний Smmplan — Словарь профессионального SMM-щика",
        description: "Все термины в одном месте. Разбираемся в технологиях продвижения и социальных метриках.",
    }
};

export default function GlossaryPage() {
    return (
        <div className="min-h-screen bg-white">
            <GlossaryContent />
        </div>
    );
}

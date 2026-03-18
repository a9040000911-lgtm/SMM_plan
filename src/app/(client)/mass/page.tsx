/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { MassOrderContent } from "@/components/stitch/mass/MassOrderContent";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Оптовое продвижение: Массовый заказ услуг | Smmplan",
    description: "Инструмент для создания массовых заказов SMM услуг. Заказывайте продвижение для десятков ссылок одновременно. Удобный импорт, быстрая валидация и оптовые цены на накрутку.",
    openGraph: {
        title: "Массовые заказы SMM — Оптовые решения для реселлеров и агентств",
        description: "Экономьте время с нашим инструментом массового заказа. Идеально подходит для больших объемов работы в соцсетях.",
    }
};

export default function MassOrderPage() {
    return (
        <div className="min-h-screen bg-white">
            <MassOrderContent />
        </div>
    );
}



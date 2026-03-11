/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { ReferralsContent } from "@/components/stitch/referrals/ReferralsContent";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Партнерская программа SMM: Зарабатывайте на рефералах | Smmplan",
    description: "Присоединяйтесь к партнерской программе Smmplan и получайте до 20% пожизненных комиссионных с каждого пополнения ваших рефералов. Стабильный доход на продвижении в соцсетях.",
    openGraph: {
        title: "Зарабатывайте с Smmplan — Лучшая партнерка в сфере SMM",
        description: "Высокие отчисления, прозрачная статистика и моментальные выплаты. Начните зарабатывать на SMM уже сегодня.",
    }
};

export default function ReferralsPage() {
    return (
        <div className="min-h-screen bg-white">
            <ReferralsContent />
        </div>
    );
}

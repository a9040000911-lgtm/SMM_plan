/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";

import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { NewOrderUI } from "@/components/stitch/dashboard/NewOrderUI";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Оформление заказа — Персонализация | Smmplan' };

async function getService(serviceId: string) {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');

    // InternalService id is a String in schema.prisma
    const service = await prisma.internalService.findFirst({
        where: { id: serviceId }
    });
    if (!service) notFound();
    return service;
}

export default async function NewOrderPage({ searchParams }: any) {
    const sp = await searchParams;
    const serviceId = sp.serviceId;

    if (!serviceId) {
        redirect('/catalog');
    }

    const service = await getService(serviceId as string);

    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-6" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Инициализация формы заказа...</p>
            </div>
        }>
            <NewOrderUI initialService={JSON.parse(JSON.stringify(service))} serviceId={serviceId as string} />
        </Suspense>
    );
}

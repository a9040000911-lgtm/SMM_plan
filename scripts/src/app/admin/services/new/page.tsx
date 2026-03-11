/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import React from 'react';
import { prisma } from '@/lib/prisma';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { NewServiceForm } from '@/components/admin/services/new-service-form';

export default async function NewServicePage() {
  const rawProviders = await prisma.provider.findMany({ where: { isEnabled: true } });
  const providers = rawProviders.map(p => ({
    ...p,
    balanceThreshold: p.balanceThreshold.toString()
  }));

  const rawServices = await prisma.providerService.findMany({
    select: {
      id: true,
      name: true,
      rawPrice: true,
      provider: {
        select: { name: true }
      }
    }
  });

  const availableServices = rawServices.map(s => ({
    id: s.id,
    name: s.name,
    rawPrice: Number(s.rawPrice),
    providerName: s.provider.name
  }));


  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 text-[13px]">
      <div className="flex items-center gap-4">
        <Link href="/admin/services" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight italic uppercase">Создание новой услуги</h2>
          <p className="text-sm text-slate-500 font-medium">Создание нового тарифа с автоматической привязкой к API.</p>
        </div>
      </div>

      <NewServiceForm
        providers={providers}
        availableServices={availableServices}
      />

    </div>
  );
}

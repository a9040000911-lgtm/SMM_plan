/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { SupportUnified } from '@/components/admin/support/support-unified';
import { AdminHeader } from '@/components/admin/core/admin-header';
import { getActiveProjectId } from '@/utils/admin-session';

export default async function SupportPage() {
  const activeProjectId = await getActiveProjectId();

  return (
    <div className="flex flex-col h-full space-y-4 p-8 bg-[#f8fafc]">
      <AdminHeader
        title="Служба поддержки"
        subtitle="Обработка тикетов и коммуникация с клиентами"
      />

      <div className="flex-1 min-h-0">
        <SupportUnified initialProjectId={activeProjectId} />
      </div>
    </div>
  );
}

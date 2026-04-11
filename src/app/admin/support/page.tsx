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
    <div className="flex flex-col h-full gap-1 p-2 sm:p-3 bg-[#f8fafc]">
      <AdminHeader
        title="Поддержка"
        subtitle="Тикеты и коммуникация"
      />

      <div className="flex-1 min-h-0">
        <SupportUnified initialProjectId={activeProjectId} />
      </div>
    </div>
  );
}

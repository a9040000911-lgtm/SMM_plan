/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { MessageSquare, Bug } from 'lucide-react';
import { AdminTabs } from '@/components/admin/core/admin-tabs';
import { SupportUnified } from '@/components/admin/support/support-unified';
import BugReportsPage from '../bug-reports/page';
import { AdminHeader } from '@/components/admin/core/admin-header';

export default function SupportPage() {
  const tabs = [
    { label: 'Чаты', icon: <MessageSquare size={16} />, id: 'chats' },
    { label: 'Баг-репорты', icon: <Bug size={16} />, id: 'bugs' },
  ];

  return (
    <div className="flex flex-col h-full space-y-4 p-8 bg-[#f8fafc]">
      <AdminHeader
        title="Поддержка"
        subtitle="Тикеты пользователей и отчеты об ошибках"
      />

      <AdminTabs
        tabs={tabs}
        className="flex-1 min-h-0 flex flex-col"
        contentClassName="flex-1 min-h-0"
      >
        <div className="h-full">
          <SupportUnified />
        </div>
        <div className="h-full overflow-y-auto">
          <BugReportsPage searchParams={Promise.resolve({})} />
        </div>
      </AdminTabs>
    </div>
  );
}



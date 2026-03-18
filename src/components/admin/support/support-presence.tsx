'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useEffect, useState } from 'react';
import { ShieldAlert, UserCheck } from 'lucide-react';
import { setPresence, getTicketPresence } from '@/app/admin/support/presence/actions';

export function SupportPresence({ ticketId }: { ticketId: string }) {
  const [otherAdmin, setOtherAdmin] = useState<string | null>(null);

  useEffect(() => {
    // 1. Сразу ставим свое присутствие
    setPresence(ticketId);

    // 2. Запускаем цикл пульсации (каждые 10 сек)
    const interval = setInterval(async () => {
      await setPresence(ticketId);
      const active = await getTicketPresence(ticketId);
      setOtherAdmin(active);
    }, 10000);

    return () => clearInterval(interval);
  }, [ticketId]);

  if (!otherAdmin) return null;

  return (
    <div className="bg-rose-600 text-white px-6 py-3 rounded-2xl flex items-center gap-3 animate-bounce shadow-xl shadow-rose-200 border border-rose-500">
      <ShieldAlert size={20} className="animate-pulse" />
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Внимание: Коллизия!</span>
        <span className="text-xs font-bold">Админ <span className="underline decoration-rose-300">{otherAdmin}</span> сейчас просматривает этот тикет.</span>
      </div>
      <div className="ml-auto bg-white/20 p-1.5 rounded-lg">
        <UserCheck size={16} />
      </div>
    </div>
  );
}



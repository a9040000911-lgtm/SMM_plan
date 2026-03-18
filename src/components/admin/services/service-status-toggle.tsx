'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useTransition } from 'react';
import { toggleServiceStatus } from '@/app/admin/services/actions';
import { Power, Loader2 } from 'lucide-react';

export function ServiceStatusToggle({ id, isActive }: { id: string, isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await toggleServiceStatus(id, !isActive);
      } catch (error: any) {
        alert(error.message);
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-widest transition-all ${isActive
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
          : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
        } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isPending ? <Loader2 size={10} className="animate-spin" /> : <Power size={10} />}
      {isActive ? 'Active' : 'Disabled'}
    </button>
  );
}



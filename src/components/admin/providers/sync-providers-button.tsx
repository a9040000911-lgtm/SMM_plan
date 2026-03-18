'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { syncAllProvidersAction } from '@/app/admin/providers/actions';

export function SyncProvidersButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncAllProvidersAction();
      alert('All provider services synced successfully!');
    } catch (e) {
      alert('Sync failed: ' + (e as any).message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
    >
      {isSyncing ? <Loader2 size={18} className="animate-spin text-blue-600" /> : <RefreshCw size={18} />}
      Sync All Services
    </button>
  );
}



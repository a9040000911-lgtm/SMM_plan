'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { syncOrderAction } from '@/app/admin/orders/actions';

export function InlineSyncButton({ orderId }: { orderId: number }) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSyncing(true);
    try {
      const res = await syncOrderAction(orderId);
      if (res.success) {
        // Успех (статус обновится через revalidatePath на сервере)
      } else {
        alert('Sync Error: ' + res.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className={`p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-all ${isSyncing ? 'animate-spin text-blue-600 bg-blue-50' : ''}`}
      title="Синхронизировать статус с API"
    >
      <RefreshCw size={14} />
    </button>
  );
}



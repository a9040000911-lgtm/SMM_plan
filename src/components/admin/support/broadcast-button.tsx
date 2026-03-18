'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';
import { broadcastNewsAction } from '@/app/admin/news/actions';
import { useRouter } from 'next/navigation';

export function BroadcastButton({ newsId }: { newsId: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [results, setResults] = useState<{ successCount: number, failCount: number } | null>(null);
  const router = useRouter();

  const handleBroadcast = async () => {
    if (!confirm('CRITICAL: This will send a notification to ALL users in Telegram. Are you sure?')) return;

    setStatus('sending');
    try {
      const res = await broadcastNewsAction(newsId);
      if (res.success) {
        setResults({ successCount: res.successCount || 0, failCount: res.failCount || 0 });
        setStatus('success');
      } else {
        alert('Broadcast failed: ' + res.error);
        setStatus('idle');
      }
    } catch (e) {
      alert('Error: ' + (e as any).message);
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <h4 className="text-lg font-bold text-emerald-800">Broadcast Completed!</h4>
          <p className="text-sm text-emerald-600">
            Successfully reached <b>{results?.successCount}</b> users.
            {results?.failCount ? ` Fails: ${results.failCount}` : ''}
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/content?tab=news')}
          className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all"
        >
          Back to News
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleBroadcast}
      disabled={status === 'sending'}
      className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 text-white rounded-2xl text-lg font-black hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all disabled:opacity-50"
    >
      {status === 'sending' ? (
        <>
          <Loader2 size={24} className="animate-spin" />
          Sending to all users...
        </>
      ) : (
        <>
          <Send size={24} />
          Broadcast to Telegram Now
        </>
      )}
    </button>
  );
}



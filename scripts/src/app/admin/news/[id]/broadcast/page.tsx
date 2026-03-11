/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Megaphone, Eye } from 'lucide-react';
import Link from 'next/link';
import { BroadcastButton } from '@/components/admin/support/broadcast-button';
import NextImage from 'next/image';

export const dynamic = 'force-dynamic';

async function getNews(id: string) {
  return await prisma.news.findUnique({
    where: { id }
  });
}

export default async function BroadcastPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const news = await getNews(id);

  if (!news) notFound();
  if (news.isSent) redirect('/admin/content?tab=news');

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/content?tab=news" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Confirm Broadcast</h2>
          <p className="text-sm text-slate-500">Last step before sending the message to all users.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <Eye size={18} className="text-blue-500" />
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Message Preview</h3>
        </div>
        <div className="p-8 space-y-6">
          {news.imageUrl && (
            <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-100 shadow-inner bg-slate-50 flex items-center justify-center relative">
              <NextImage src={news.imageUrl} alt="Preview" fill className="object-contain" />
            </div>
          )}
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900">{news.title}</h1>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{news.content}</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
            <Megaphone size={20} />
          </div>
          <div>
            <h4 className="font-bold text-blue-900">Broadcasting Rules</h4>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              Once initiated, this process cannot be reversed. The message will be sent sequentially to all unique users registered in the bot database.
            </p>
          </div>
        </div>

        <BroadcastButton newsId={news.id} />
      </div>
    </div>
  );
}

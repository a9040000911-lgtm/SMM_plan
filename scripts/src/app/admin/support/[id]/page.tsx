/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { TicketChat } from '@/components/admin/support/ticket-chat';
import { formatAmount } from '@/utils/formatter';
import { SupportPresence } from '@/components/admin/support/support-presence';

export const dynamic = 'force-dynamic';

async function getTicket(id: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: true,
      messages: { orderBy: { createdAt: 'asc' } }
    }
  });

  const templates = await prisma.supportTemplate.findMany({
    orderBy: { updatedAt: 'desc' }
  });

  const macros = await prisma.supportMacro.findMany({
    orderBy: { updatedAt: 'desc' }
  });

  return { ticket, templates, macros };
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getTicket(id);
  const { ticket, templates, macros } = data;

  if (!ticket) notFound();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ПРОВЕРКА КОЛЛИЗИИ */}
      <SupportPresence ticketId={ticket.id} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/support" className="p-2 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{ticket.subject}</h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-medium">
              <span>Тикет #{ticket.id.split('-')[0].toUpperCase()}</span>
              <span>•</span>
              <span suppressHydrationWarning>{new Date(ticket.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <TicketChat
            ticketId={ticket.id}
            initialMessages={ticket.messages as any}
            status={ticket.status}
            templates={templates}
            macros={macros}
          />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-black mb-3">
                {(ticket.user.username || 'U').substring(0, 2).toUpperCase()}
              </div>
              <h4 className="font-black text-slate-800">@{ticket.user.username || 'user'}</h4>
              <p className="text-[10px] text-slate-400 font-mono mt-1 truncate w-full">{ticket.user.id}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-50 py-4">
              <div className="text-center">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Баланс</div>
                <div className="text-sm font-black text-slate-700">{formatAmount(ticket.user.balance)}₽</div>
              </div>
              <div className="text-center border-l border-slate-50">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Потрачено</div>
                <div className="text-sm font-black text-slate-700">{formatAmount(ticket.user.spent)}₽</div>
              </div>
            </div>

            <Link
              href={`/admin/users/${ticket.user.id}`}
              className="w-full py-2.5 bg-slate-50 text-slate-700 rounded-md text-xs font-black uppercase text-center hover:bg-slate-100 transition-all block"
            >
              Профиль клиента
            </Link>
          </div>

          <div className="bg-slate-900 rounded-lg p-6 text-white shadow-xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ShieldCheck size={14} className="text-blue-400" />
              Статус тикета
            </h4>
            <div className="space-y-3">
              <div className="text-xl font-black text-blue-400 uppercase italic">{ticket.status}</div>
              <p className="text-[10px] text-slate-500 uppercase font-bold leading-tight">Последняя активность: <br /><span suppressHydrationWarning>{new Date(ticket.updatedAt).toLocaleString()}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

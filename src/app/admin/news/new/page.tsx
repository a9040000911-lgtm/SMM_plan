/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';

import React from 'react';
import { ArrowLeft, Save, Type, FileText, Image as ImageIcon, Globe } from 'lucide-react';
import Link from 'next/link';
import { createNewsAction } from '../actions';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export default async function NewNewsPage() {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get('admin_session');
  const { verifyAdminSession } = await import('@/lib/jwt');
  const session = sessionData ? await verifyAdminSession(sessionData.value) : null;

  if (!session) return <div>Access Denied</div>;

  let projects = [];
  if (session.isGlobalAdmin) {
    projects = await prisma.project.findMany({ select: { id: true, name: true, slug: true } });
  } else {
    projects = await prisma.project.findMany({
      where: { id: { in: session.allowedProjects } },
      select: { id: true, name: true, slug: true }
    });
  }
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/news" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Draft Announcement</h2>
          <p className="text-sm text-slate-500">Create a new message for platform-wide broadcast.</p>
        </div>
      </div>

      <form action={createNewsAction} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 space-y-6">

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <Globe size={14} /> Target Project
            </label>
            <select
              name="projectId"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold transition-all"
            >
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} ({p.slug})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <Type size={14} /> Announcement Title
            </label>
            <input
              name="title"
              type="text"
              required
              placeholder="e.g. Major Platform Update!"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <FileText size={14} /> Message Content
            </label>
            <textarea
              name="content"
              required
              rows={10}
              placeholder="Write your announcement message here... (Markdown supported in bot)"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <ImageIcon size={14} /> Optional Image URL
            </label>
            <input
              name="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono transition-all"
            />
            <p className="text-[10px] text-slate-400 px-1 italic">Providing an image URL will send the announcement as a photo message in Telegram.</p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <Link
            href="/admin/news"
            className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Discard
          </Link>
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
          >
            <Save size={18} />
            Save Draft
          </button>
        </div>
      </form>
    </div>
  );
}

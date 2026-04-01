'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

export function ServiceFilter({
  initialSearch,
  initialPlatform
}: {
  initialSearch: string,
  initialPlatform: string
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    const params = new URLSearchParams(searchParams.toString());

    if (search) params.set('search', search);
    else params.delete('search');

    router.push(`/admin/services?${params.toString()}`);
  };

  const handlePlatformChange = (platform: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (platform !== 'ALL') params.set('platform', platform);
    else params.delete('platform');

    router.push(`/admin/services?${params.toString()}`);
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
      <div className="relative flex-1 min-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <form onSubmit={handleSearch}>
          <input
            type="text"
            name="search"
            defaultValue={initialSearch}
            placeholder="Поиск по названию или ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </form>
      </div>

      <select
        name="platform"
        className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        defaultValue={initialPlatform || 'ALL'}
        onChange={(e) => handlePlatformChange(e.target.value)}
      >
        <option value="ALL">Все платформы</option>
        <option value="TELEGRAM">Telegram</option>
        <option value="INSTAGRAM">Instagram</option>
        <option value="VK">VK</option>
        <option value="YOUTUBE">YouTube</option>
        <option value="TIKTOK">TikTok</option>
        <option value="TWITTER">Twitter/X</option>
        <option value="FACEBOOK">Facebook</option>
        <option value="THREADS">Threads</option>
        <option value="DISCORD">Discord</option>
        <option value="REDDIT">Reddit</option>
        <option value="LINKEDIN">LinkedIn</option>
        <option value="PINTEREST">Pinterest</option>
        <option value="SNAPCHAT">Snapchat</option>
        <option value="KICK">Kick</option>
        <option value="RUTUBE">Rutube</option>
        <option value="DZEN">Dzen</option>
        <option value="STEAM">Steam</option>
        <option value="GOOGLE">Google</option>
        <option value="TROVO">Trovo</option>
        <option value="YANDEX">Yandex</option>
        <option value="WEBSITE">Website</option>
        <option value="OTHER">Другое</option>
      </select>
    </div>
  );
}



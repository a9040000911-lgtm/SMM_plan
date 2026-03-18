"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Button, AdminCard } from '@/components/admin/ui';
import { Pencil, X, Save, Globe, Palette } from 'lucide-react';
import { updateProjectAction } from '@/app/admin/projects/actions';

interface Project {
  id: string;
  name: string;
  slug: string;
  botToken: string | null;
  domain: string;
  brandColor: string;
  maintenanceMode: boolean;
  loyaltySettings: {
    levels: boolean;
    referrals: boolean;
    earlyBird: boolean;
  } | null;
}

export function ProjectEditorModal({ project }: { project: Project }) {
  const [isOpen, setIsOpen] = useState(false);
   
  // eslint-disable-next-line unused-imports/no-unused-vars
  const [showToken, setShowToken] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-600 transition-all"
        title="Редактировать проект"
      >
        <Pencil size={14} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg animate-in zoom-in-95 duration-200">
        <AdminCard
          title={`Настройка: ${project.name}`}
          action={<button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>}
        >
          <form action={async (formData) => {
            await updateProjectAction(project.id, formData);
            setIsOpen(false);
          }} className="p-6 space-y-6">

            <div className="space-y-4">
              {/* Название */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Globe size={12} /> Название платформы
                </label>
                <input
                  name="name"
                  defaultValue={project.name}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                  required
                />
              </div>

              {/* Домен */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Globe size={12} /> Домен (host)
                </label>
                <input
                  name="domain"
                  defaultValue={project.domain}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="smmplan.ru"
                />
              </div>

            </div>

            {/* Цвет, Режим и Лояльность */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Palette size={12} /> Цвет бренда
                </label>
                <input
                  name="brandColor"
                  type="color"
                  defaultValue={project.brandColor}
                  className="w-full h-10 p-1 bg-white border border-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Тех. работы</label>
                <label className="flex items-center gap-3 h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    name="maintenanceMode"
                    defaultChecked={project.maintenanceMode}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-600 uppercase">Включить</span>
                </label>
              </div>

              <div className="sm:col-span-3 pt-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Настройки лояльности</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Levels */}
                  <label className="flex items-center gap-3 h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      name="loyalty_levels"
                      defaultChecked={project.loyaltySettings?.levels ?? true}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-600">🏆 Уровни</span>
                  </label>

                  {/* Referrals */}
                  <label className="flex items-center gap-3 h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      name="loyalty_referrals"
                      defaultChecked={project.loyaltySettings?.referrals ?? true}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-600">👥 Рефералы</span>
                  </label>

                  {/* Early Bird */}
                  <label className="flex items-center gap-3 h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      name="loyalty_earlyBird"
                      defaultChecked={project.loyaltySettings?.earlyBird ?? true}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-600">⚡ Early Bird</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>Отмена</Button>
              <Button type="submit" className="flex-1 gap-2">
                <Save size={16} /> Сохранить изменения
              </Button>
            </div>
          </form>
        </AdminCard>
      </div>
    </div>
  );
}



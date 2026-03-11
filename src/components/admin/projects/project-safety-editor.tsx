"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Button } from '@/components/admin/ui';
import { ShieldCheck, Save, AlertTriangle } from 'lucide-react';
import { updateProjectSafetyAction } from '@/app/admin/projects/actions';

interface SafetySettings {
  maxSingleOrder: number;
  maxSingleOrderEnabled: boolean;
  maxDailyProjectSpend: number;
  maxDailyProjectSpendEnabled: boolean;
  alertThreshold: number;
}

interface ProjectSafetyEditorProps {
  projectId: string;
  initialSettings: SafetySettings;
}

export function ProjectSafetyEditor({ projectId, initialSettings }: ProjectSafetyEditorProps) {
  const [settings, setSettings] = useState<SafetySettings>(initialSettings || {
    maxSingleOrder: 5000,
    maxSingleOrderEnabled: false,
    maxDailyProjectSpend: 50000,
    maxDailyProjectSpendEnabled: false,
    alertThreshold: 1000
  });
  const [isSaving, setIsSaving] = useState(false);

  const updateSetting = (field: keyof SafetySettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProjectSafetyAction(projectId, settings);
      alert('Настройки безопасности сохранены!');
    } catch (_e) {
      alert('Ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 mt-6 border-t pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-rose-600">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="font-bold">Финансовая безопасность</h3>
        </div>
        <Button size="sm" variant="outline" onClick={handleSave} disabled={isSaving} className="border-rose-200 text-rose-700 hover:bg-rose-50">
          <Save className="w-4 h-4 mr-2" />
          Сохранить лимиты
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Лимит на один заказ */}
        <div className={`p-4 rounded-2xl border transition-all ${settings.maxSingleOrderEnabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-70'}`}>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Макс. сумма одного заказа</label>
            <input 
              type="checkbox" 
              checked={settings.maxSingleOrderEnabled} 
              onChange={(e) => updateSetting('maxSingleOrderEnabled', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              disabled={!settings.maxSingleOrderEnabled}
              value={settings.maxSingleOrder} 
              onChange={(e) => updateSetting('maxSingleOrder', parseFloat(e.target.value) || 0)}
              className="flex-1 p-2 bg-slate-50 border rounded-xl text-sm font-bold font-mono focus:ring-2 focus:ring-rose-500/20 outline-none disabled:opacity-50"
            />
            <span className="text-xs font-bold text-slate-400">₽</span>
          </div>
        </div>

        {/* Суточный лимит */}
        <div className={`p-4 rounded-2xl border transition-all ${settings.maxDailyProjectSpendEnabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-70'}`}>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Суточный лимит проекта</label>
            <input 
              type="checkbox" 
              checked={settings.maxDailyProjectSpendEnabled} 
              onChange={(e) => updateSetting('maxDailyProjectSpendEnabled', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              disabled={!settings.maxDailyProjectSpendEnabled}
              value={settings.maxDailyProjectSpend} 
              onChange={(e) => updateSetting('maxDailyProjectSpend', parseFloat(e.target.value) || 0)}
              className="flex-1 p-2 bg-slate-50 border rounded-xl text-sm font-bold font-mono focus:ring-2 focus:ring-rose-500/20 outline-none disabled:opacity-50"
            />
            <span className="text-xs font-bold text-slate-400">₽</span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-3">
        <AlertTriangle size={16} className="text-rose-500 mt-0.5 shrink-0" />
        <p className="text-[9px] text-rose-700 leading-tight">
          Эти лимиты защищают вас от &quot;слива&quot; баланса провайдеров в случае взлома или ошибки в наценках. Рекомендуется ставить лимит не более 50% от вашего текущего баланса у провайдера.
        </p>
      </div>
    </div>
  );
}

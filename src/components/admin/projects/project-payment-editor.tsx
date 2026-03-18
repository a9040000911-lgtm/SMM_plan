"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Button } from '@/components/admin/ui';
import { CreditCard, Save, ShieldCheck } from 'lucide-react';
import { updateProjectPaymentAction } from '@/app/admin/projects/actions';

interface PaymentSettings {
  provider: 'YOOKASSA' | 'ROBOKASSA';
  shopId: string;
  secretKey: string;
}

interface ProjectPaymentEditorProps {
  projectId: string;
  initialSettings: PaymentSettings;
}

export function ProjectPaymentEditor({ projectId, initialSettings }: ProjectPaymentEditorProps) {
  const [settings, setSettings] = useState<PaymentSettings>(initialSettings || {
    provider: 'YOOKASSA',
    shopId: '',
    secretKey: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const updateSetting = (field: keyof PaymentSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProjectPaymentAction(projectId, settings);
      alert('Настройки платежей сохранены!');
    } catch (_e) {
      alert('Ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 mt-6 border-t pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-600">
          <CreditCard className="w-5 h-5" />
          <h3 className="font-bold text-slate-800 tracking-tight">Платежная система</h3>
        </div>
        <Button size="sm" variant="outline" onClick={handleSave} disabled={isSaving} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Сохранение...' : 'Применить ключи'}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Провайдер</label>
          <select 
            value={settings.provider} 
            onChange={(e) => updateSetting('provider', e.target.value as any)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all"
          >
            <option value="YOOKASSA">ЮKassa (Текущий основной)</option>
            <option value="ROBOKASSA">Robokassa (В разработке)</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shop ID</label>
            <input 
              type="text" 
              value={settings.shopId} 
              onChange={(e) => updateSetting('shopId', e.target.value)}
              placeholder="123456"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secret Key</label>
            <input 
              type="password" 
              value={settings.secretKey} 
              onChange={(e) => updateSetting('secretKey', e.target.value)}
              placeholder="test_..."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-3">
        <ShieldCheck size={16} className="text-indigo-500 mt-0.5 shrink-0" />
        <p className="text-[9px] text-indigo-700 leading-tight">
          Используйте уникальные ключи для каждого магазина. Это позволит разделять финансовые потоки между вашими ботами и сайтами.
        </p>
      </div>
    </div>
  );
}



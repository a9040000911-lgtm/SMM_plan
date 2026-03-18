"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Button } from '@/components/admin/ui';
import { Plus, Trash2, Save, Zap, Calculator } from 'lucide-react';
import { updateProjectPricingRulesAction } from '@/app/admin/projects/actions';

interface Rule {
  min: number;
  max: number;
  markup: number;
}

interface ProjectPricingEditorProps {
  projectId: string;
  initialRules: Rule[];
}

export function ProjectPricingEditor({ projectId, initialRules }: ProjectPricingEditorProps) {
  const [rules, setRules] = useState<Rule[]>(initialRules.length > 0 ? initialRules : [
    { min: 0, max: 10, markup: 500 },
    { min: 10, max: 100, markup: 200 },
    { min: 100, max: 10000, markup: 50 }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // 2FA State
  const [show2FA, setShow2FA] = useState(false);
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);

  const addRule = () => {
    setRules([...rules, { min: 0, max: 0, markup: 0 }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: keyof Rule, value: string) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: parseFloat(value) || 0 };
    setRules(newRules);
  };

  const strartSaveProcess = async () => {
    setShow2FA(true);
    setCode('');
    // Auto-request code on open? Or let user click?
    // Let's auto-request for better UX
    /*
    // Optional: Auto-request
    try {
        const { requestProjectSettings2FA } = await import('@/app/admin/projects/actions');
        const res = await requestProjectSettings2FA();
        if (res.success) setSentTo(res.sentTo);
        else alert(res.error);
    } catch (e) {
        console.error(e);
    }
    */
  };

  const handleRequestCode = async () => {
    try {
      const { requestProjectSettings2FA } = await import('@/app/admin/projects/actions');
      const res = await requestProjectSettings2FA();
      if (res.success) {
        setSentTo(res.sentTo || 'Email');
        alert(`Код отправлен в ${res.sentTo || 'Email'}`);
      } else {
        alert(res.error);
      }
    } catch (_e) {
      alert('Ошибка запроса кода');
    }
  };

  const handleConfirmSave = async () => {
    if (!code) return alert('Введите код подтверждения');

    setIsSaving(true);
    try {
      // Сортируем правила по минимальной цене перед сохранением
      const sortedRules = [...rules].sort((a, b) => a.min - b.min);
      const res = await updateProjectPricingRulesAction(projectId, sortedRules, code);

      if (res.success) {
        alert('Правила наценки сохранены!');
        setShow2FA(false);
      } else {
        alert(res.error || 'Ошибка сохранения');
      }
    } catch {
      alert('Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-800">Умная наценка проекта</h3>
        </div>
        <Button size="sm" onClick={strartSaveProcess} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Сохранение...' : 'Сохранить правила'}
        </Button>
      </div>

      {/* 2FA Modal Overlay */}
      {show2FA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Zap size={24} />
              </div>
              <h3 className="font-bold text-slate-800">Подтвердите действие</h3>
              <p className="text-xs text-slate-500">
                Для изменения коммерческих настроек требуется подтверждение.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {!sentTo ? (
                <button
                  onClick={handleRequestCode}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all"
                >
                  Отправить код подтверждения
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-xs font-medium text-center">
                    Код отправлен в <b>{sentTo}</b>
                  </div>
                  <input
                    type="text"
                    placeholder="Введите код (или Master Key)"
                    className="w-full text-center text-2xl font-black tracking-widest p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShow2FA(false)}
                className="py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors text-xs"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={isSaving || !code}
                className="py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Проверка...' : 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-4">Настройка диапазонов</p>

        <div className="space-y-3">
          {rules.map((rule, index) => (
            <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-left-2">
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">От (₽)</label>
                  <input
                    type="number"
                    value={rule.min}
                    onChange={(e) => updateRule(index, 'min', e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">До (₽)</label>
                  <input
                    type="number"
                    value={rule.max}
                    onChange={(e) => updateRule(index, 'max', e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Наценка (%)</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">+</span>
                    <input
                      type="number"
                      value={rule.markup}
                      onChange={(e) => updateRule(index, 'markup', e.target.value)}
                      className="w-full p-2 pl-5 bg-emerald-50/50 border border-emerald-100 rounded-lg text-xs font-bold text-emerald-700 font-mono"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeRule(index)}
                className="mt-4 p-2 text-slate-300 hover:text-rose-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addRule}
          className="w-full mt-4 p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-500 hover:border-indigo-200 transition-all flex items-center justify-center gap-2 text-xs font-bold"
        >
          <Plus size={14} />
          Добавить диапазон
        </button>
      </div>

      <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-3">
        <Zap size={16} className="text-indigo-500 mt-0.5" />
        <p className="text-[10px] text-indigo-700 leading-relaxed">
          <b>Как это работает:</b> если базовая цена услуги попадает в указанный диапазон, к ней применится процент наценки.
          Если цена не попадает ни в один диапазон — будет использована базовая цена из каталога.
          Ручные цены в карточке услуги всегда имеют приоритет над этими правилами.
        </p>
      </div>
    </div>
  );
}



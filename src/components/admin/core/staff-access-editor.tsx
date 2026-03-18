"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Button } from '@/components/admin/ui';
import { Shield, Check, ChevronDown, Globe, Loader2 } from 'lucide-react';
import { updateStaffAccessAction } from '@/app/admin/employees/actions';

interface Project {
  id: string;
  name: string;
}

interface StaffAccessEditorProps {
  userId: string;
  isGlobal: boolean;
  accessibleProjectIds: string[];
  allProjects: Project[];
  allowedTabs: string[];
  permissions: string[];
}

const TABS = [
  { id: 'dashboard', name: 'Панель (Admin)' },
  { id: 'projects', name: 'Проекты (Платформы)' },
  { id: 'support', name: 'Тикеты (Поддержка)' },
  { id: 'orders', name: 'Заказы' },
  { id: 'transactions', name: 'Транзакции' },
  { id: 'reports', name: 'Отчеты' },
  { id: 'expenses', name: 'Расходы' },
  { id: 'users', name: 'Пользователи' },
  { id: 'employees', name: 'Сотрудники' },
  { id: 'services', name: 'Услуги (Каталог)' },
  { id: 'health', name: 'Здоровье услуг' },
  { id: 'markup', name: 'Наценка' },
  { id: 'import', name: 'Импорт услуг' },
  { id: 'providers', name: 'Провайдеры' },
  { id: 'news', name: 'Новости' },
  { id: 'loyalty', name: 'Лояльность' },
  { id: 'settings', name: 'Настройки' },
  { id: 'logs', name: 'Логи' },
  { id: 'security', name: 'Аудит и Безопасность' }, // New tab
];

const PERMISSIONS = [
  { id: 'VIEW_FINANCE', name: 'Просмотр финансов', desc: 'Доход, расход, статистика' },
  { id: 'MANAGE_USERS', name: 'Управление юзерами', desc: 'Бан, редактирование профиля' },
  { id: 'ADJUST_BALANCE', name: 'Ручное начисление', desc: 'Изменение баланса пользователя' },
  { id: 'MANAGE_PROVIDERS', name: 'Провайдеры', desc: 'Смена API ключей и ссылок' },
  { id: 'VIEW_LOGS', name: 'Просмотр логов', desc: 'Действия админов' },
  { id: 'MANAGE_CONTENT', name: 'Контент', desc: 'Новости, статьи, документы' },
  { id: 'MANAGE_PROMO', name: 'Промокоды', desc: 'Создание и удаление' },
];

export function StaffAccessEditor({ userId, isGlobal, accessibleProjectIds, allProjects, allowedTabs, permissions }: StaffAccessEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(accessibleProjectIds);
  const [selectedTabs, setSelectedTabs] = useState<string[]>(allowedTabs || []);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(permissions || []);
  const [global, setGlobal] = useState(isGlobal);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeView, setActiveView] = useState<'projects' | 'tabs' | 'permissions'>('projects');

  const toggleProject = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleTab = (id: string) => {
    setSelectedTabs(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const togglePermission = (id: string) => {
    setSelectedPermissions(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateStaffAccessAction(userId, selectedIds, global, selectedTabs, selectedPermissions);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
      }, 1000);
    } catch (_e) {
      alert('Ошибка сохранения: недостаточно прав или ошибка сервера');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase transition-all shadow-sm ${global ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
      >
        <Shield size={12} className={global ? 'text-blue-600' : 'text-slate-400'} />
        {global ? 'Полный доступ' : `Права (${selectedIds.length} пр / ${selectedTabs.length} вкл / ${selectedPermissions.length} пр)`}
        <ChevronDown size={10} className="opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-[100] p-4 animate-in zoom-in-95 duration-200">
          <div className="space-y-4">
            <label className="flex items-center justify-between p-2 bg-rose-50 rounded-xl cursor-pointer group">
              <div className="flex items-center gap-2 text-rose-700">
                <Globe size={14} />
                <span className="text-[10px] font-black uppercase">Глобальный админ</span>
              </div>
              <input
                type="checkbox"
                checked={global}
                onChange={(e) => setGlobal(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
              />
            </label>

            {!global && (
              <>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveView('projects')}
                    className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${activeView === 'projects' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                  >
                    Проекты
                  </button>
                  <button
                    onClick={() => setActiveView('tabs')}
                    className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${activeView === 'tabs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                  >
                    Вкладки
                  </button>
                  <button
                    onClick={() => setActiveView('permissions')}
                    className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${activeView === 'permissions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                  >
                    Действия
                  </button>
                </div>

                <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                  {activeView === 'projects' && (
                    allProjects.map(project => (
                      <div
                        key={project.id}
                        onClick={() => toggleProject(project.id)}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group"
                      >
                        <span className={`text-[11px] font-bold ${selectedIds.includes(project.id) ? 'text-slate-900' : 'text-slate-400'}`}>
                          {project.name}
                        </span>
                        {selectedIds.includes(project.id) && <Check size={12} className="text-emerald-500" />}
                      </div>
                    ))
                  )}

                  {activeView === 'tabs' && (
                    TABS.map(tab => (
                      <div
                        key={tab.id}
                        onClick={() => toggleTab(tab.id)}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group"
                      >
                        <span className={`text-[11px] font-bold ${selectedTabs.includes(tab.id) ? 'text-slate-900' : 'text-slate-400'}`}>
                          {tab.name}
                        </span>
                        {selectedTabs.includes(tab.id) && <Check size={12} className="text-blue-500" />}
                      </div>
                    ))
                  )}

                  {activeView === 'permissions' && (
                    PERMISSIONS.map(perm => (
                      <div
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group"
                      >
                        <div className="flex flex-col">
                          <span className={`text-[11px] font-bold ${selectedPermissions.includes(perm.id) ? 'text-slate-900' : 'text-slate-400'}`}>
                            {perm.name}
                          </span>
                          <span className="text-[9px] text-slate-400">{perm.desc}</span>
                        </div>

                        {selectedPermissions.includes(perm.id) && <Check size={12} className="text-purple-500" />}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Button size="sm" variant="ghost" className="flex-1" onClick={() => setIsOpen(false)}>Отмена</Button>
              <Button
                size="sm"
                className={`flex-1 ${isSuccess ? 'bg-emerald-500 border-emerald-500' : ''}`}
                onClick={handleSave}
                disabled={isSaving || isSuccess}
              >
                {isSaving ? <Loader2 size={12} className="animate-spin" /> : (isSuccess ? <Check size={12} /> : 'Ок')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



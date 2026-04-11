'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Shield, Save, AlertCircle, Info, Cpu, Globe } from 'lucide-react';
import { updateGlobalSettingsAction } from './global-settings-actions';
import { toast } from 'sonner';

interface GlobalSettingsFormProps {
    initialSettings: Record<string, string>;
}

export function GlobalSettingsForm({ initialSettings }: GlobalSettingsFormProps) {
    const [settings, setSettings] = useState(initialSettings);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'security' | 'payments' | 'ai' | 'dev'>('security');

    const handleSave = async () => {
        setIsSaving(true);
        // Note: Encryption should ideally happen server-side to keep the key safe.
        // But since we are calling a server action, let's pass them as is 
        // and let the server action handle encryption.
        
        const res = await updateGlobalSettingsAction(settings);
        setIsSaving(false);

        if (res.success) {
            toast.success('Настройки успешно обновлены');
        } else {
            toast.error('Ошибка: ' + res.error);
        }
    };

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 text-white rounded-lg">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-800 tracking-tight">Глобальная Платформа</h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Управление ядром Smmplan</p>
                            </div>
                        </div>

                        <nav className="flex items-center bg-slate-100 p-1 rounded-xl">
                            <button 
                                onClick={() => setActiveTab('security')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'security' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Безопасность
                            </button>
                            <button 
                                onClick={() => setActiveTab('payments')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'payments' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Платежи (Default)
                            </button>
                            <button 
                                onClick={() => setActiveTab('ai')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'ai' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                AI Интеграция
                            </button>
                            <button 
                                onClick={() => setActiveTab('dev')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'dev' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Разработка
                            </button>
                        </nav>
                    </div>
                    
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-900/20 disabled:opacity-50"
                    >
                        <Save size={16} />
                        {isSaving ? 'Сохранение...' : 'Сохранить всё'}
                    </button>
                </div>

                <div className="p-8">
                    {activeTab === 'security' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Auth Limiter */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        Лимит авторизации (запросов/мин)
                                        <div className="group relative">
                                            <Info size={12} className="text-slate-300 cursor-help" />
                                            <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                                                Защита от подбора паролей. Рекомендуемое значение: 30-60.
                                            </div>
                                        </div>
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.LIMIT_AUTH || '60'}
                                        onChange={(e) => handleChange('LIMIT_AUTH', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                {/* API Limiter */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        Лимит API (запросов/мин)
                                        <div className="group relative">
                                            <Info size={12} className="text-slate-300 cursor-help" />
                                            <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                                                Для внутренних API запросов (клиентские запросы, TMA). Рекомендуемое значение: 100-200.
                                            </div>
                                        </div>
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.LIMIT_API || '150'}
                                        onChange={(e) => handleChange('LIMIT_API', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                {/* Public Limiter */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        Лимит на публичные страницы (запросов/мин)
                                        <div className="group relative">
                                            <Info size={12} className="text-slate-300 cursor-help" />
                                            <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                                                Обычный просмотр страниц фронтенда. Рекомендуемое значение: 200-500.
                                            </div>
                                        </div>
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.LIMIT_PUBLIC || '300'}
                                        onChange={(e) => handleChange('LIMIT_PUBLIC', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-4">
                                <div className="p-2 bg-white text-blue-600 rounded-lg shadow-sm self-start">
                                    <AlertCircle size={18} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">Важное примечание</p>
                                    <p className="text-[11px] font-medium text-blue-800 leading-relaxed">
                                        Глобальные администраторы (владельцы платформы) полностью игнорируют эти лимиты.
                                        Изменения вступают в силу в течение 30 секунд после сохранения.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="space-y-8">
                            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-4 items-center">
                                <div className="p-3 bg-white text-indigo-600 rounded-xl shadow-sm">
                                    <Globe size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Глобальные платежные реквизиты</h3>
                                    <p className="text-[11px] text-slate-500 font-medium max-w-2xl">
                                        Эти настройки будут использоваться для всех проектов, где не заданы индивидуальные ключи. 
                                        Все данные шифруются по стандарту AES-256 перед сохранением в базу.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* YooKassa */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-indigo-600 pb-2 border-b border-slate-100">
                                        <Cpu size={16} />
                                        <h4 className="text-xs font-black uppercase tracking-widest">ЮKassa (Default)</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Shop ID</label>
                                            <input
                                                type="text"
                                                value={settings.GLOBAL_YOOKASSA_SHOP_ID || ''}
                                                onChange={(e) => handleChange('GLOBAL_YOOKASSA_SHOP_ID', e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Например: 123456"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Secret Key</label>
                                            <input
                                                type="password"
                                                value={settings.GLOBAL_YOOKASSA_SECRET_KEY || ''}
                                                onChange={(e) => handleChange('GLOBAL_YOOKASSA_SECRET_KEY', e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="live_..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Robokassa */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-indigo-600 pb-2 border-b border-slate-100">
                                        <Cpu size={16} />
                                        <h4 className="text-xs font-black uppercase tracking-widest">Robokassa (Default)</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Merchant Login</label>
                                            <input
                                                type="text"
                                                value={settings.GLOBAL_ROBOKASSA_MERCHANT_LOGIN || ''}
                                                onChange={(e) => handleChange('GLOBAL_ROBOKASSA_MERCHANT_LOGIN', e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Password 1</label>
                                            <input
                                                type="password"
                                                value={settings.GLOBAL_ROBOKASSA_PASSWORD1 || ''}
                                                onChange={(e) => handleChange('GLOBAL_ROBOKASSA_PASSWORD1', e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Global Payment Mode */}
                            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-8">
                                <div className="max-w-xs space-y-3 flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Глобальный режим оплаты (Default)</label>
                                    <select
                                        value={settings.GLOBAL_PAYMENT_MODE || 'PRODUCTION'}
                                        onChange={(e) => handleChange('GLOBAL_PAYMENT_MODE', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="PRODUCTION">Production (Реальные платежи)</option>
                                        <option value="TEST">Test (Тестовые платежи)</option>
                                    </select>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        Этот режим будет использоваться по умолчанию.
                                    </p>
                                </div>
                                <div className="max-w-xs space-y-3 flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        Наценка B2B (Доля от 0 до 1)
                                        <div className="group relative">
                                            <Info size={12} className="text-slate-300 cursor-help" />
                                            <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                                                Например: 1.00 = +100% наценка (удвоение стоимости провайдера). Покрывает УСН 6%, НДС 5%, Эквайринг 3.5%, OpEx и чистую прибыль ~27.5%.
                                            </div>
                                        </div>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={settings.B2B_MARGIN_PERCENT || '1.00'}
                                        onChange={(e) => handleChange('B2B_MARGIN_PERCENT', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        Оптовая маржинальность платформы.
                                    </p>
                                </div>

                                {/* Auto Price Decrease Toggle */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        Автоснижение цен
                                        <div className="group relative">
                                            <Info size={12} className="text-slate-300 cursor-help" />
                                            <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                                                Если включено, розничные цены будут автоматически снижаться при падении себестоимости провайдера. Safety Floor (x2.07 от себестоимости) никогда не нарушается.
                                            </div>
                                        </div>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => handleChange('PRICING_AUTO_DECREASE', settings.PRICING_AUTO_DECREASE === 'true' ? 'false' : 'true')}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                                            settings.PRICING_AUTO_DECREASE === 'true' ? 'bg-emerald-500' : 'bg-slate-200'
                                        }`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                                            settings.PRICING_AUTO_DECREASE === 'true' ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                    </button>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        {settings.PRICING_AUTO_DECREASE === 'true' 
                                            ? '✅ Цены снижаются автоматически (Safety Floor защищён)' 
                                            : '🔒 Цены только повышаются (по умолчанию)'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ai' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <Cpu size={18} className="text-slate-400" />
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Интеграция ИИ (Gemini)</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Активная модель ИИ</label>
                                    <select
                                        value={settings.AI_SELECTED_MODEL || 'gemini-3-flash-preview'}
                                        onChange={(e) => handleChange('AI_SELECTED_MODEL', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    >
                                        {(settings.AI_MODEL_LIST || 'gemini-3-flash-preview, gemini-3-flash').split(',').map(m => (
                                            <option key={m.trim()} value={m.trim()}>{m.trim()}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Список доступных моделей (через запятую)</label>
                                    <input
                                        type="text"
                                        value={settings.AI_MODEL_LIST || 'gemini-3-flash-preview, gemini-3-flash'}
                                        onChange={(e) => handleChange('AI_MODEL_LIST', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="gemini-3-flash-preview, gemini-3-flash"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Globe size={12} /> Прокси для ИИ (Host:Port)
                                </label>
                                <input
                                    type="text"
                                    value={settings.AI_PROXY || ''}
                                    onChange={(e) => handleChange('AI_PROXY', e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="например: 205.142.241.25:443"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'dev' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex items-center gap-2">
                                <Cpu size={18} className="text-slate-400" />
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Инструменты разработки</h3>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Mock Провайдер (E2E Тестирование)
                                    <div className="group relative">
                                        <Info size={12} className="text-slate-300 cursor-help" />
                                        <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                                            Включает встроенный эмулятор провайдеров для E2E тестирования заказов. В продакшене рекомендуется выключать.
                                        </div>
                                    </div>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => handleChange('MOCK_PROVIDER_ENABLED', settings.MOCK_PROVIDER_ENABLED === 'true' ? 'false' : 'true')}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                                        settings.MOCK_PROVIDER_ENABLED === 'true' ? 'bg-emerald-500' : 'bg-slate-200'
                                    }`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                                        settings.MOCK_PROVIDER_ENABLED === 'true' ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                                <p className="text-[10px] text-slate-400 font-medium">
                                    {settings.MOCK_PROVIDER_ENABLED === 'true' 
                                        ? '✅ Мок-провайдер включен глобально и доступен для запросов' 
                                        : '🔒 Мок-провайдер выключен (возвращает 404 Not Found)'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}



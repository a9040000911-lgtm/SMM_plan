'use client';

import React, { useState } from 'react';
import { Mail, Save, Play, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function SmtpSettingsForm({ initialConfig }: { initialConfig: any }) {
    const [config, setConfig] = useState(initialConfig || { host: '', port: '465', user: '', password: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/settings/smtp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...config, action: 'SAVE' })
            });
            const data = await res.json();
            
            if (data.success) {
                toast.success('SMTP конфигурация успешно сохранена');
            } else {
                toast.error('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
            }
        } catch (e: any) {
            toast.error('Ошибка соединения: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleTest = async () => {
        setIsTesting(true);
        const toastId = toast.loading('Тестирование SMTP соединения...');
        try {
            const res = await fetch('/api/admin/settings/smtp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...config, action: 'TEST' })
            });
            const data = await res.json();
            
            if (data.success) {
                toast.success(data.message || 'ОК', { id: toastId });
            } else {
                toast.error('Сбой подключения: ' + (data.error || 'Неверные доступы'), { id: toastId });
            }
        } catch (e: any) {
            toast.error('Ошибка соединения: ' + e.message, { id: toastId });
        } finally {
            setIsTesting(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setConfig((prev: any) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-lg">
                            <Mail size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">Сервер исходящей почты</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SMTP Конфигурация</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={handleTest}
                            disabled={isTesting || !config.host}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-all disabled:opacity-50"
                        >
                            <Play size={16} />
                            {isTesting ? 'Проверка...' : 'Тестировать'}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-900/20 disabled:opacity-50"
                        >
                            <Save size={16} />
                            {isSaving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                Хост (SMTP Host)
                            </label>
                            <input
                                type="text"
                                value={config.host}
                                onChange={(e) => handleChange('host', e.target.value)}
                                placeholder="smtp.yandex.ru"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                Порт (обычно 465)
                            </label>
                            <input
                                type="text"
                                value={config.port}
                                onChange={(e) => handleChange('port', e.target.value)}
                                placeholder="465"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                Логин (Почта / Username)
                            </label>
                            <input
                                type="text"
                                value={config.user}
                                onChange={(e) => handleChange('user', e.target.value)}
                                placeholder="no-reply@domain.ru"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                Пароль (App Password)
                            </label>
                            <input
                                type="password"
                                value={config.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                placeholder="********"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono"
                            />
                        </div>
                    </div>
                    
                    <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-4 text-amber-800 max-w-4xl">
                         <div className="mt-0.5">
                             <CheckCircle2 size={16} className="text-amber-600" />
                         </div>
                         <div>
                             <p className="text-xs font-bold uppercase tracking-wide">Безопасность</p>
                             <p className="text-[11px] mt-1 leading-relaxed">
                                Для почтовых систем (Yandex, Mail, Google) необходимо использовать специально сгенерированные "Пароли Приложений" (App Passwords) вместо вашего личного пароля.
                                Сохраненный пароль шифруется алгоритмом AES-256 (CryptoService) и скрывается от чтения в открытом виде.
                             </p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

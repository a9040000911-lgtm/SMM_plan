'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, Key, Loader2, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const scriptContainerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'email' | 'telegram'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requires2fa, setRequires2fa] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (activeTab === 'telegram') {
      const script = document.createElement('script');
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.setAttribute('data-telegram-login', process.env.NEXT_PUBLIC_BOT_USERNAME || 'smmplan_bot');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '12');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;

      (window as any).onTelegramAuth = async (user: any) => {
        setIsLoading(true);
        try {
          const response = await fetch('/api/admin/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'telegram', data: user }),
          });

          const data = await response.json();

          if (response.ok) {
            if (data.requires2fa) {
              setEmail(data.email);
              setRequires2fa(true);
              setActiveTab('email'); // Переключаемся на форму ввода кода
            } else {
              router.push('/admin');
            }
          } else {
            alert(`Доступ запрещен: ${data.error}`);
            setIsLoading(false);
          }
        } catch (_err) {
          alert('Ошибка при авторизации через Telegram');
          setIsLoading(false);
        }
      };

      if (scriptContainerRef.current) {
        scriptContainerRef.current.innerHTML = '';
        scriptContainerRef.current.appendChild(script);
      }
    }

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [activeTab, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: requires2fa ? '2fa_verify' : 'email',
          email,
          password,
          code: twoFactorCode
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requires2fa) {
          setRequires2fa(true);
          setIsLoading(false);
        } else {
          // Success! Keep loading state while redirecting
          router.push('/admin');
        }
      } else {
        alert(`Ошибка: ${data.error}`);
        setIsLoading(false);
      }
    } catch (_e) {
      alert('Ошибка сети');
      setIsLoading(false);
    }
  };

    const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: resetStep === 1 ? 'request' : 'reset',
          email,
          code: resetCode,
          newPassword
        }),
      });

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { error: text || res.statusText || 'Неизвестная ошибка сервера' };
      }

      if (res.ok) {
        if (resetStep === 1) {
          setResetStep(2);
          alert('Код отправлен на почту');
        } else {
          setIsResetting(false);
          setResetStep(1);
          alert('Пароль успешно изменен. Теперь вы можете войти.');
        }
      } else {
        alert("Ошибка: " + (data.error || 'Доступ запрещен'));
      }
    } catch (err: any) {
      console.error('Reset error:', err);
      alert('Ошибка при сбросе пароля: ' + (err.message || 'Ошибка сети'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {requires2fa || isResetting ? <ShieldCheck size={32} className="text-emerald-500" /> : <Lock size={32} />}
          </div>
          <h1 className="text-2xl font-black text-white">
            {isResetting ? 'Восстановление' : (requires2fa ? 'Подтверждение входа' : 'Вход в систему')}
          </h1>
          <p className="text-slate-400 text-sm">
            {isResetting
              ? (resetStep === 1 ? 'Введите email для получения кода сброса' : 'Введите код из письма и новый пароль')
              : (requires2fa ? 'Введите 6-значный код, отправленный в ваш Telegram или на Почту.' : 'Выберите метод авторизации для доступа к панели.')
            }
          </p>
        </div>

        {/* Переключатель вкладок - скрываем если идет 2FA или Сброс */}
        {!requires2fa && !isResetting && (
          <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === 'email' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              Почта и пароль
            </button>
            <button
              onClick={() => setActiveTab('telegram')}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === 'telegram' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              Telegram
            </button>
          </div>
        )}

        {!requires2fa && !isResetting && activeTab === 'email' ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Email адрес</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@smmplan.com"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-[0_0_0_30px_#0f172a_inset_!important] [-webkit-text-fill-color:white_!important]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between px-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Пароль</label>
                <button
                  type="button"
                  onClick={() => setIsResetting(true)}
                  className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest"
                >
                  Забыли?
                </button>
              </div>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-[0_0_0_30px_#0f172a_inset_!important] [-webkit-text-fill-color:white_!important]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  Войти в панель
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        ) : isResetting ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Email администратора</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white outline-none focus:border-blue-500 transition-all"
                required
                disabled={resetStep === 2}
              />
            </div>

            {resetStep === 2 && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Код из письма</label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="000000"
                    className="w-full px-4 py-3 bg-slate-950 border border-blue-500/50 rounded-2xl text-center font-mono text-xl tracking-widest text-white outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Новый пароль</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Минимум 8 символов"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white outline-none focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (resetStep === 1 ? 'Получить код' : 'Сбросить пароль')}
            </button>

            <button
              type="button"
              onClick={() => { setIsResetting(false); setResetStep(1); }}
              className="w-full py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest"
            >
              Отмена
            </button>
          </form>
        ) : activeTab === 'email' ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {requires2fa && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Код безопасности</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-blue-500/50 rounded-2xl text-xl font-mono tracking-[0.5em] text-center text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    autoFocus
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {requires2fa ? 'Подтвердить код' : 'Войти в панель'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {requires2fa && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const res = await fetch('/api/admin/auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'email', email, password }),
                      });
                      if (res.ok) alert('Код повторно отправлен на почту и в Telegram');
                    } catch (_e) {
                      alert('Ошибка при переотправке');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="w-full py-2 text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors"
                >
                  Не пришел код? Отправить еще раз
                </button>
                <button
                  type="button"
                  onClick={() => { setRequires2fa(false); setTwoFactorCode(''); }}
                  className="w-full py-2 text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors"
                >
                  Вернуться к вводу пароля
                </button>
              </div>
            )}
          </form>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <div ref={scriptContainerRef} className="min-h-[40px]"></div>
            <p className="text-[10px] text-slate-500 text-center max-w-[200px] leading-relaxed">
              Быстрый и безопасный вход через ваш аккаунт Telegram.
            </p>
          </div>
        )}

        <div className="pt-6 border-t border-slate-800/50 flex items-center justify-center gap-2 text-slate-600 text-[10px] uppercase font-bold tracking-widest">
          <ShieldCheck size={12} className="text-emerald-500" />
          Защищенная корпоративная среда
        </div>
      </div>

      <p className="mt-8 text-slate-700 text-[10px] font-medium uppercase tracking-tighter">
        Система управления платформой SMMPlan v1.2
      </p>
    </div>
  );
}

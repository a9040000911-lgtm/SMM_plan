'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React, { useEffect, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  botUsername: string;
  onSuccess?: () => void;
  lang?: string;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: string;
  requestAccess?: string;
}

/**
 * Telegram Login Widget Component (Next.js Compatible)
 */
export const TelegramLoginButton: React.FC<Props> = ({
  botUsername,
  onSuccess,
  lang = 'ru',
  buttonSize = 'large',
  cornerRadius = '12',
  requestAccess = 'write'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !botUsername) return;

    // Define the global callback BEFORE adding the script
    (window as any).onTelegramAuth = async (user: any) => {
        setIsLoggingIn(true);
        try {
            const res = await fetch('/api/auth/telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user),
            });
            const data = await res.json();

            if (data.success && data.token) {
                // Finalize login through NextAuth Credentials Provider
                const loginRes = await signIn('credentials', {
                    magicToken: data.token,
                    redirect: false,
                });

                if (loginRes?.error) {
                    toast.error('Ошибка сессии после авторизации');
                } else {
                    onSuccess?.();
                }
            } else {
                toast.error(data.error || 'Ошибка верификации Telegram');
            }
        } catch (e) {
            console.error('[TG_AUTH_CALLBACK_ERROR]', e);
            toast.error('Ошибка входа через Telegram');
        } finally {
            setIsLoggingIn(false);
        }
    };

    // Create the script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-radius', cornerRadius);
    script.setAttribute('data-auth-url', ''); // Don't use direct auth URL, we use callback
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', requestAccess);
    if (lang) script.setAttribute('data-lang', lang);

    containerRef.current.innerHTML = ''; // Clear previous if any
    containerRef.current.appendChild(script);

    return () => {
        // Cleanup if necessary
        if (containerRef.current) containerRef.current.innerHTML = '';
        delete (window as any).onTelegramAuth;
    };
  }, [botUsername, buttonSize, cornerRadius, requestAccess, lang, onSuccess]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full">
      <div 
        ref={containerRef} 
        className={`relative transition-opacity duration-300 ${isLoggingIn ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}
      />
      
      {isLoggingIn && (
        <div className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" /> Авторизация...
        </div>
      )}
    </div>
  );
};

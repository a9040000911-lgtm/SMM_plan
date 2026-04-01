import { useCallback } from 'react';
import { toast } from 'sonner';

export function useOrderAuth(session: any, state: any) {
    const {
        email, setAuthMode, setError, isSendingCode, setIsSendingCode, password, magicCode
    } = state;

    const handleEmailBlur = useCallback(async () => {
        if (!email || email.length < 5 || !email.includes('@')) return;
        try {
            const res = await fetch('/api/auth/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (data.exists) {
                setAuthMode((prev: any) => prev === 'MAGIC' ? 'MAGIC' : 'PASSWORD');
                setError((prev: any) => prev ? prev : 'Этот аккаунт уже зарегистрирован. Введите пароль для входа.');
            }
        } catch (e) {
            console.warn('Email check failed', e);
        }
    }, [email, setAuthMode, setError]);

    const handleSendMagicCode = useCallback(async () => {
        if (!email || isSendingCode) return;
        setIsSendingCode(true);
        setError(null);
        try {
            const res = await fetch('/api/client/auth/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                setAuthMode('MAGIC');
                toast.success('Код отправлен на почту!');
            } else {
                const data = await res.json();
                setError(data.error || 'Не удалось отправить код');
            }
        } catch {
            setError('Ошибка сети при отправке кода');
        } finally {
            setIsSendingCode(false);
        }
    }, [email, isSendingCode, setIsSendingCode, setError, setAuthMode]);

    const isEmailValid = email.includes('@') && email.includes('.');
    const isAuthValid = !!session || isEmailValid;
    const isAuthParamsValid = !state.authMode ||
        (state.authMode === 'PASSWORD' && password.length >= 3) ||
        (state.authMode === 'MAGIC' && magicCode.length >= 5);

    return {
        handleEmailBlur,
        handleSendMagicCode,
        isEmailValid,
        isAuthValid,
        isAuthParamsValid
    };
}

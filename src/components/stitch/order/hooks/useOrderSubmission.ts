import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';

export function useOrderSubmission(
    session: any,
    state: any,
    analysisResult: any,
    isLinkValid: boolean,
    isAuthValid: boolean,
    isAuthParamsValid: boolean
) {
    const {
        selectedService, link, quantity, platform, isDripFeed, runs, interval,
        isScheduled, scheduleTime, repeatInterval, pollOption, email, authMode, password, magicCode,
        isValidationBypassed, isManualMode, setIsSubmitting, setAuthMode, setError
    } = state;

    // === VALIDATION COMPOUND ===
    const isQtyMultiple = useMemo(() => {
        if (!selectedService || !selectedService.qtyStep || selectedService.qtyStep <= 1) return true;
        return (quantity % selectedService.qtyStep) === 0;
    }, [quantity, selectedService]);

    const isQuantityValid = selectedService && quantity >= (selectedService.minQty || 1);

    const validationError = useMemo(() => {
        if (!selectedService || !analysisResult || isValidationBypassed || isManualMode) return null;
        const serviceType = selectedService.targetType || 'POST';
        const linkType = analysisResult.targetType || 'POST';
        if (serviceType === linkType) return null;
        if (serviceType === 'CHANNEL' && linkType === 'POST') return null;
        return `Внимание: Вы выбрали услугу типа "${serviceType}", но ссылка ведет на "${linkType}". Это может привести к отмене заказа.`;
    }, [selectedService, analysisResult, isValidationBypassed, isManualMode]);

    const canSubmit = !!(isLinkValid && isQuantityValid && isQtyMultiple && isAuthValid && isAuthParamsValid && (!validationError || isValidationBypassed));
    const totalPrice = selectedService ? (quantity / 1000) * selectedService.pricePer1000 : 0;

    // === ACTIONS ===
    const handleAddToCart = useCallback(() => {
        if (!selectedService || !link || !quantity) return;
        const cartItem = {
            id: Math.random().toString(36).substr(2, 9),
            serviceId: selectedService.id,
            platformLabel: platform || 'SOCIAL',
            strategyLabel: selectedService.name,
            price: totalPrice,
            link,
            quantity,
            subs: quantity,
            views: 0,
            pollOption: pollOption !== null ? pollOption : undefined,
        };
        const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
        localStorage.setItem('cart', JSON.stringify([...existingCart, cartItem]));
        window.dispatchEvent(new Event('cart-updated'));
        toast.success('Добавлено в корзину!', { icon: '🛒' });
    }, [selectedService, link, quantity, platform, totalPrice, pollOption]);

    const handleOrder = useCallback(async () => {
        if (!canSubmit || !selectedService) return;
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/client/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId: selectedService.id,
                    link,
                    quantity,
                    email: !session ? email : undefined,
                    password: authMode === 'PASSWORD' ? password : undefined,
                    magicCode: authMode === 'MAGIC' ? magicCode : undefined,
                    isDripFeed,
                    runs: isDripFeed ? runs : undefined,
                    interval: isDripFeed ? interval : undefined,
                    scheduleTime: isScheduled ? scheduleTime : undefined,
                    repeatInterval: isScheduled && repeatInterval ? repeatInterval : undefined,
                    pollOption: pollOption !== null ? pollOption : undefined,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 409) {
                    setAuthMode('PASSWORD');
                    setError(data.message || 'Этот email уже зарегистрирован. Введите пароль.');
                    return;
                }
                if (response.status === 401) {
                    setAuthMode((prev: any) => prev || 'PASSWORD');
                    setError(data.message || data.error || 'Неверный пароль или код');
                    return;
                }
                throw new Error(data.message || data.error || 'Ошибка при создании заказа');
            }
            if (data.requiresPayment && data.paymentUrl) {
                localStorage.setItem('smmplan_draft_order', JSON.stringify({
                    expiresAt: Date.now() + 1000 * 60 * 60,
                    data: { link, serviceId: selectedService.id, quantity, isDripFeed, runs, interval, pollOption },
                }));
                if (data.loginToken) {
                    try {
                        await signIn('credentials', { magicToken: data.loginToken, redirect: false });
                    } catch (authErr) {
                        console.warn('[Seamless Auth] Failed', authErr);
                    }
                }
                window.location.href = data.paymentUrl;
            } else {
                window.location.href = '/orders?payment=success';
            }
        } catch (err: any) {
            console.error('Order Error:', err);
            toast.error(err.message || 'Произошла ошибка. Попробуйте снова.');
        } finally {
            setIsSubmitting(false);
        }
    }, [canSubmit, selectedService, link, quantity, session, email, authMode, password, magicCode, isDripFeed, runs, interval, isScheduled, scheduleTime, repeatInterval, pollOption, setIsSubmitting, setAuthMode, setError]);

    return {
        isQtyMultiple,
        isQuantityValid,
        validationError,
        canSubmit,
        totalPrice,
        handleAddToCart,
        handleOrder
    };
}

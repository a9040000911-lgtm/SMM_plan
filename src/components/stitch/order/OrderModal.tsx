'use client';
/**
 * OrderModal — Full-screen two-column order form
 * Variant C: "One Screen — Zero Transitions"
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket, Star, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

import { useOrderFlow } from './hooks/useOrderFlow';
import { LinkInput } from './sections/LinkInput';
import { ServiceCarousel } from './sections/ServiceCarousel';
import { QuantityConfig } from './sections/QuantityConfig';
import { OrderSummary } from './sections/OrderSummary';
import { GuestAuth } from './sections/GuestAuth';
import { PollOptionConfig } from './sections/PollOptionConfig';

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialServiceId?: string;
    initialLink?: string;
}

export const OrderModal: React.FC<OrderModalProps> = ({
    isOpen,
    onClose,
    initialServiceId,
    initialLink,
}) => {
    const flow = useOrderFlow(initialServiceId, initialLink);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
        } else {
            document.body.style.overflow = 'unset';
            document.body.classList.remove('modal-open');
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.classList.remove('modal-open');
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9000]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.98 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        className="fixed inset-0 z-[9999] flex flex-col bg-white overflow-hidden"
                    >
                        {/* === HEADER === */}
                        <header className="w-full bg-white border-b border-slate-100 px-4 md:px-8 py-3 flex items-center justify-between shrink-0 min-h-[64px]">
                            <div className="flex items-center gap-5">
                                <Link
                                    href="/"
                                    className="flex items-center gap-2.5 group"
                                    onClick={onClose}
                                >
                                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-blue-500/20">
                                        <Rocket className="text-white w-4.5 h-4.5" />
                                    </div>
                                    <div className="hidden sm:flex flex-col">
                                        <span className="text-base font-black tracking-tighter text-slate-900 leading-none">
                                            Smmplan
                                        </span>
                                        <span className="text-[7px] font-bold text-blue-600 uppercase tracking-[0.25em] mt-0.5">
                                            Premium SMM
                                        </span>
                                    </div>
                                </Link>

                                <div className="h-7 w-px bg-slate-100 hidden md:block" />

                                <h1 className="text-sm font-black uppercase tracking-tight text-slate-900 hidden md:block">
                                    Оформление заказа
                                </h1>
                            </div>

                            {/* Trust indicators */}
                            <div className="flex items-center gap-4">
                                <div className="hidden lg:flex items-center gap-5">
                                    <div className="flex items-center gap-1.5">
                                        <Star size={13} className="text-amber-400 fill-amber-400" />
                                        <span className="text-xs font-black text-slate-900">4.9/5</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <ShieldCheck size={13} className="text-emerald-500" />
                                        <span className="text-[11px] font-bold text-slate-500">Безопасно</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Zap size={13} className="text-blue-500" />
                                        <span className="text-[11px] font-bold text-slate-500">Мгновенно</span>
                                    </div>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                    aria-label="Закрыть"
                                >
                                    <X size={18} className="text-slate-600" />
                                </button>
                            </div>
                        </header>

                        {/* === BODY: Two-column layout === */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden">
                            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-full">
                                
                                {/* LEFT COLUMN: Form */}
                                <div className="flex-1 min-w-0 space-y-5">
                                    {/* 1. Link Input */}
                                    <LinkInput
                                        link={flow.link}
                                        onLinkChange={flow.setLink}
                                        platform={flow.platform}
                                        analysisResult={flow.analysisResult}
                                        isAnalyzing={flow.isAnalyzing}
                                        isLinkInvalid={flow.isLinkInvalid}
                                        isAmbiguous={flow.isAmbiguous}
                                        ambiguityInfo={flow.ambiguityInfo}
                                        onResolveAmbiguity={flow.handleResolveAmbiguity}
                                        linkInputHint={flow.linkInputHint}
                                        activeBrandColor={flow.activeBrandColor}
                                    />

                                    {/* 2. Service Selection (Carousel + Filters) */}
                                    <ServiceCarousel
                                        categories={flow.availableCategories}
                                        selectedCategory={flow.selectedCategory}
                                        onSelectCategory={flow.setSelectedCategory}
                                        services={flow.filteredServices}
                                        selectedService={flow.selectedService}
                                        onSelectService={flow.setSelectedService}
                                        isLoading={flow.isLoadingServices}
                                        favoriteIds={flow.favoriteIds}
                                        onToggleFavorite={flow.toggleFavorite}
                                        activeFilters={flow.activeFilters}
                                        onToggleFilter={flow.toggleFilter}
                                        searchQuery={flow.searchQuery}
                                        onSearchChange={flow.setSearchQuery}
                                    />

                                    <div className="flex flex-col xl:flex-row xl:items-start gap-5">
                                         {/* 3. Quantity & Specialized Config */}
                                         <div className="xl:w-[40%] min-w-0 flex flex-col gap-5">
                                             {flow.selectedService && (
                                                 <QuantityConfig
                                                     quantity={flow.quantity}
                                                     onQuantityChange={flow.setQuantity}
                                                     service={flow.selectedService}
                                                     isQtyMultiple={flow.isQtyMultiple}
                                                     totalPrice={flow.totalPrice}
                                                 />
                                             )}

                                             {flow.detectedTargetType === 'POLL' && (
                                                 <PollOptionConfig
                                                     value={flow.pollOption}
                                                     onChange={flow.setPollOption}
                                                     activeBrandColor={flow.activeBrandColor}
                                                 />
                                             )}
                                         </div>

                                        {/* 4. Guest Auth (shown for unauthenticated users) */}
                                        <div className="xl:w-[60%] min-w-0">
                                            <GuestAuth
                                                email={flow.email}
                                                onEmailChange={flow.setEmail}
                                                onEmailBlur={flow.handleEmailBlur}
                                                authMode={flow.authMode}
                                                password={flow.password}
                                                onPasswordChange={flow.setPassword}
                                                magicCode={flow.magicCode}
                                                onMagicCodeChange={flow.setMagicCode}
                                                onSendMagicCode={flow.handleSendMagicCode}
                                                isSendingCode={flow.isSendingCode}
                                                error={flow.error}
                                                onErrorClear={() => flow.setError(null)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: Sticky Order Summary */}
                                <div className="w-full lg:w-[380px] shrink-0">
                                    <div className="lg:sticky lg:top-6">
                                        <OrderSummary
                                            selectedService={flow.selectedService}
                                            platform={flow.platform}
                                            quantity={flow.quantity}
                                            totalPrice={flow.totalPrice}
                                            canSubmit={flow.canSubmit}
                                            isSubmitting={flow.isSubmitting}
                                            validationError={flow.validationError}
                                            isValidationBypassed={flow.isValidationBypassed}
                                            onBypassValidation={() => flow.setIsValidationBypassed(true)}
                                            onOrder={flow.handleOrder}
                                            onAddToCart={flow.handleAddToCart}
                                            isDripFeed={flow.isDripFeed}
                                            onDripFeedChange={flow.setIsDripFeed}
                                            runs={flow.runs}
                                            onRunsChange={flow.setRuns}
                                            interval={flow.interval}
                                            onIntervalChange={flow.setInterval}
                                            isScheduled={flow.isScheduled}
                                            onScheduledChange={flow.setIsScheduled}
                                            scheduleTime={flow.scheduleTime}
                                            onScheduleTimeChange={flow.setScheduleTime}
                                            activeBrandColor={flow.activeBrandColor}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* === MOBILE STICKY BOTTOM BAR === */}
                        <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-3 flex items-center justify-between gap-3 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Итого</span>
                                <span className="text-xl font-black text-slate-900 tracking-tight">
                                    {flow.totalPrice > 0 ? `${flow.totalPrice.toFixed(2)} ₽` : '—'}
                                </span>
                            </div>
                            <button
                                onClick={flow.handleOrder}
                                disabled={!flow.canSubmit || flow.isSubmitting}
                                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-blue-500/25 disabled:shadow-none flex items-center gap-2"
                            >
                                {flow.isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Rocket size={16} />
                                )}
                                {flow.isSubmitting ? 'Обработка...' : 'Запустить'}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

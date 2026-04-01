'use client';
/**
 * LinkInput — URL input with AI link analysis and ambiguity resolution
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, AlertCircle, CheckCircle2, Sparkles, Info } from 'lucide-react';
import { cn } from '@/utils/ui';
import { translatePlatform, translateTargetType } from '@/utils/translations';
import { BrandIcon } from '../../ui/BrandIcon';

interface LinkInputProps {
    link: string;
    onLinkChange: (link: string) => void;
    platform: string | null;
    analysisResult: any;
    isAnalyzing: boolean;
    isLinkInvalid: boolean;
    isAmbiguous: boolean;
    ambiguityInfo: any;
    onResolveAmbiguity: (option: any) => void;
    linkInputHint: { type: 'error' | 'warning'; message: string } | null;
    activeBrandColor: string;
}

export const LinkInput: React.FC<LinkInputProps> = ({
    link,
    onLinkChange,
    platform,
    analysisResult,
    isAnalyzing,
    isLinkInvalid,
    isAmbiguous,
    ambiguityInfo,
    onResolveAmbiguity,
    linkInputHint,
    activeBrandColor,
}) => {
    const isPlatformDetected = platform && platform !== 'OTHER';

    return (
        <div className="space-y-3">
            {/* Section Header with Badges */}
            <div className="flex items-center justify-between mb-3 lg:w-3/4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Link2 size={13} className="text-blue-600" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">Ссылка</span>
                </div>
                
                {/* Detection Badges moved top-right */}
                <AnimatePresence>
                    {isPlatformDetected && analysisResult && (
                        <motion.div
                            key="detection-badges"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                        >
                            <span
                                className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white shadow-sm"
                                style={{ backgroundColor: activeBrandColor }}
                            >
                                {translatePlatform(analysisResult.platform)}
                            </span>
                            {analysisResult.targetType && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                                    {translateTargetType(analysisResult.targetType)}
                                </span>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input */}
            <div className={cn(
                "lg:w-3/4 relative bg-slate-50 border-2 rounded-2xl transition-all overflow-hidden",
                linkInputHint?.type === 'error' ? "border-red-300 focus-within:border-red-400" :
                isPlatformDetected ? "border-emerald-200 focus-within:border-emerald-300" :
                "border-slate-200 focus-within:border-blue-300"
            )}>
                <div className="flex items-center px-4 py-3.5">
                    {isPlatformDetected && (
                        <div className="mr-3 shrink-0">
                            <BrandIcon name={platform!.toLowerCase()} size={22} />
                        </div>
                    )}
                    <input
                        type="url"
                        value={link}
                        onChange={(e) => onLinkChange(e.target.value)}
                        placeholder="Вставьте ссылку на канал, пост или профиль..."
                        className="flex-1 bg-transparent border-none outline-none text-slate-900 font-semibold text-sm placeholder:text-slate-400 placeholder:font-medium"
                        autoComplete="off"
                        autoFocus
                    />
                    {isAnalyzing && (
                        <div className="ml-2 flex items-center gap-1.5 shrink-0">
                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hidden sm:block">анализ</span>
                        </div>
                    )}
                    {isPlatformDetected && !isAnalyzing && (
                        <CheckCircle2 size={18} className="ml-2 text-emerald-500 shrink-0" />
                    )}
                </div>
            </div>

            {/* Validation Hint */}
            <AnimatePresence>
                {linkInputHint && (
                    <motion.div
                        key="validation-hint"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="mt-2 flex items-center gap-2"
                    >
                        <Info size={14} className={linkInputHint.type === 'error' ? 'text-red-500' : 'text-amber-500'} />
                        <span className={cn(
                            "text-xs font-medium",
                            linkInputHint.type === 'error' ? 'text-red-600' : 'text-amber-600'
                        )}>
                            {linkInputHint.message}
                        </span>
                    </motion.div>
                )}
                
                {/* Multi-Media Smart Tip */}
                {isPlatformDetected && analysisResult?.targetType === 'POST' && (
                    <motion.div
                        key="multimedia-tip"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex gap-3"
                    >
                        <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                        <div className="text-[11px] text-blue-900 leading-relaxed font-medium">
                            <strong className="block mb-0.5 font-bold text-blue-950">В посте несколько медиа? (Альбом)</strong>
                            Для накрутки на всю медиагруппу сделайте <strong>2 заказа</strong>: скопируйте ссылку на первое фото/видео, а затем второй заказ — на последнее.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Invalid Link Warning */}
            <AnimatePresence>
                {isLinkInvalid && !linkInputHint && (
                    <motion.div
                        key="invalid-link-warning"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100"
                    >
                        <AlertCircle size={14} />
                        Платформа не определена. Проверьте ссылку или выберите платформу вручную.
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Ambiguity Resolution — Compact Inline */}
            <AnimatePresence>
                {isAmbiguous && ambiguityInfo && (
                    <motion.div
                        key="ambiguity-resolution"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                            <Sparkles size={14} className="text-blue-500 shrink-0" />
                            <span className="text-[11px] font-bold text-slate-600 shrink-0">Уточните тип:</span>
                            <div className="flex items-center gap-2 flex-1">
                                {ambiguityInfo.options.map((opt: any) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => onResolveAmbiguity(opt)}
                                        className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 hover:border-blue-500 hover:text-blue-600 hover:shadow-sm transition-all"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

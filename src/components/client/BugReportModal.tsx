"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from "react";
import { X, Bug, Upload, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/ui";

interface BugReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SEVERITY_OPTIONS = [
    { value: "MINOR", label: "Minor", reward: 50, color: "text-yellow-500", description: "Косметические ошибки, опечатки" },
    { value: "MAJOR", label: "Major", reward: 200, color: "text-orange-500", description: "Функционал работает некорректно" },
    { value: "CRITICAL", label: "Critical", reward: 500, color: "text-red-500", description: "Критический баг, блокирующий работу" },
];

export const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [severity, setSeverity] = useState<"MINOR" | "MAJOR" | "CRITICAL">("MINOR");
    const [stepsToReproduce, setStepsToReproduce] = useState("");
    const [screenshotUrl, setScreenshotUrl] = useState("");
    const [consent, setConsent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const selectedSeverity = SEVERITY_OPTIONS.find(s => s.value === severity);

    const handleSubmit = async () => {
        if (!title || !description || !consent) {
            alert("Пожалуйста, заполните обязательные поля и дайте согласие на обработку данных");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/client/bug-reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    severity,
                    stepsToReproduce,
                    screenshotUrl
                })
            });

            if (response.ok) {
                setIsSuccess(true);
                setTimeout(() => {
                    resetForm();
                    onClose();
                }, 2000);
            } else {
                alert("Ошибка при отправке. Попробуйте еще раз.");
            }
        } catch (error) {
            console.error("Bug report error:", error);
            alert("Ошибка соединения");
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setSeverity("MINOR");
        setStepsToReproduce("");
        setScreenshotUrl("");
        setIsSuccess(false);
    };

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
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={onClose}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="cyber-box bg-[#0a0c12] border-orange-500/30 max-w-2xl w-full p-8 space-y-6 relative overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            {/* Background Glow */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl -mr-20 -mt-20" />

                            {isSuccess ? (
                                // Success State
                                <div className="relative z-10 text-center py-12 space-y-4">
                                    <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                                        <AlertTriangle size={40} className="rotate-180" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white uppercase">Спасибо!</h2>
                                    <p className="text-sm text-slate-400">
                                        Ваш отчет отправлен. Если баг будет подтвержден, вы получите вознаграждение{" "}
                                        <span className="font-black text-primary">{selectedSeverity?.reward}₽</span>
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Header */}
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-orange-500/20 text-orange-500 rounded-xl flex items-center justify-center">
                                                <Bug size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black tracking-tight italic text-white">Bug Report</h2>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                                                    Нашли баг? Получите {selectedSeverity?.reward}₽!
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Severity Selector */}
                                    <div className="relative z-10 space-y-3">
                                        <label className="text-xs font-black uppercase tracking-widest text-primary/70">
                                            Серьезность бага *
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {SEVERITY_OPTIONS.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setSeverity(option.value as any)}
                                                    className={cn(
                                                        "p-4 rounded-xl border-2 transition-all text-left",
                                                        severity === option.value
                                                            ? "border-primary bg-primary/20"
                                                            : "border-white/10 bg-white/5 hover:border-primary/50"
                                                    )}
                                                >
                                                    <div className={cn("font-black text-sm uppercase", option.color)}>
                                                        {option.label}
                                                    </div>
                                                    <div className="text-xs text-primary font-black mt-1">
                                                        Reward: {option.reward}₽
                                                    </div>
                                                    <div className="text-[9px] text-slate-500 mt-2">
                                                        {option.description}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Title Input */}
                                    <div className="relative z-10 space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-primary/70">
                                            Краткое описание *
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Например: Кнопка пополнения не работает"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-sm focus:border-primary focus:bg-white/10 transition-all outline-none"
                                            maxLength={100}
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="relative z-10 space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-primary/70">
                                            Подробное описание *
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Опишите баг как можно подробнее..."
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-sm focus:border-primary focus:bg-white/10 transition-all outline-none resize-none"
                                            rows={4}
                                        />
                                    </div>

                                    {/* Steps to Reproduce */}
                                    <div className="relative z-10 space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-primary/70">
                                            Шаги воспроизведения (опционально)
                                        </label>
                                        <textarea
                                            value={stepsToReproduce}
                                            onChange={(e) => setStepsToReproduce(e.target.value)}
                                            placeholder="1. Зайти на страницу...&#10;2. Нажать на кнопку...&#10;3. Баг происходит когда..."
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-sm focus:border-primary focus:bg-white/10 transition-all outline-none resize-none"
                                            rows={3}
                                        />
                                    </div>

                                    {/* Screenshot URL */}
                                    <div className="relative z-10 space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-primary/70 flex items-center gap-2">
                                            <Upload size={12} />
                                            Ссылка на скриншот (опционально)
                                        </label>
                                        <input
                                            type="url"
                                            value={screenshotUrl}
                                            onChange={(e) => setScreenshotUrl(e.target.value)}
                                            placeholder="https://imgur.com/... или https://prnt.sc/..."
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-sm focus:border-primary focus:bg-white/10 transition-all outline-none"
                                        />
                                        <p className="text-[9px] text-slate-500">
                                            Загрузите скриншот на imgur.com, prnt.sc или любой другой хостинг и вставьте ссылку
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="relative z-10 flex items-start gap-3 mb-6">
                                        <input
                                            type="checkbox"
                                            id="bug_consent"
                                            checked={consent}
                                            onChange={(e) => setConsent(e.target.checked)}
                                            className="mt-1 shrink-0 w-4 h-4 rounded border-white/10 bg-white/5 text-orange-500 focus:ring-orange-500 cursor-pointer"
                                        />
                                        <label htmlFor="bug_consent" className="text-xs text-slate-400 font-medium leading-relaxed">
                                            Я даю согласие на обработку моих персональных данных в соответствии с{' '}
                                            <a href="/docs/policy" target="_blank" className="text-orange-500 hover:underline">Политикой конфиденциальности</a>
                                        </label>
                                    </div>
                                    <div className="relative z-10 flex gap-3">
                                        <button
                                            onClick={onClose}
                                            disabled={isLoading}
                                            className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
                                        >
                                            Отмена
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isLoading || !title || !description || !consent}
                                            className="flex-1 px-6 py-3 bg-orange-500 text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                                    Отправка...
                                                </>
                                            ) : (
                                                <>
                                                    <Bug size={16} />
                                                    Отправить
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};



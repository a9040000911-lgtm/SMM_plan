"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from "react";
import { X, Star, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/ui";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId?: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, orderId }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [text, setText] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            alert("Пожалуйста, выберите оценку");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/client/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rating,
                    text: text.trim() || null,
                    isAnonymous,
                    orderId
                })
            });

            if (response.ok) {
                setIsSuccess(true);
                setTimeout(() => {
                    resetForm();
                    onClose();
                }, 2000);
            } else {
                alert("Ошибка при отправке отзыва");
            }
        } catch (error) {
            console.error("Review error:", error);
            alert("Ошибка соединения");
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setRating(0);
        setText("");
        setIsAnonymous(false);
        setIsSuccess(false);
    };

    const ratingLabels = ["Ужасно", "Плохо", "Нормально", "Хорошо", "Отлично!"];

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
                            className="bg-white border-slate-200 shadow-2xl shadow-slate-200/50 rounded-3xl max-w-md w-full p-8 space-y-6 relative overflow-hidden"
                        >
                            {/* Background Glow */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20" />

                            {isSuccess ? (
                                // Success State
                                <div className="relative z-10 text-center py-12 space-y-4">
                                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                        <Star size={40} className="fill-current" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-800 uppercase">Спасибо!</h2>
                                    <p className="text-sm text-slate-500">
                                        Ваш отзыв отправлен на модерацию. Мы ценим вашу обратную связь!
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Header */}
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
                                                <MessageSquare size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black tracking-tight italic text-slate-800">Оставить отзыв</h2>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                                                    Поделитесь вашим опытом
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Rating Stars */}
                                    <div className="relative z-10 space-y-4">
                                        <label className="text-xs font-black uppercase tracking-widest text-primary/70">
                                            Ваша оценка *
                                        </label>
                                        <div className="flex items-center justify-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={() => setRating(star)}
                                                    onMouseEnter={() => setHoverRating(star)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    className="transition-transform hover:scale-110"
                                                >
                                                    <Star
                                                        size={40}
                                                        className={cn(
                                                            "transition-all",
                                                            (hoverRating || rating) >= star
                                                                ? "text-yellow-400 fill-yellow-400"
                                                                : "text-slate-200"
                                                        )}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        {rating > 0 && (
                                            <div className="text-center text-sm font-black text-primary animate-fade-in">
                                                {ratingLabels[rating - 1]}
                                            </div>
                                        )}
                                    </div>

                                    {/* Review Text */}
                                    <div className="relative z-10 space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-primary/70">
                                            Ваш отзыв (опционально)
                                        </label>
                                        <textarea
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            placeholder="Расскажите о вашем опыте использования сервиса..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                                            rows={4}
                                            maxLength={500}
                                        />
                                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                                            <span>Максимум 500 символов</span>
                                            <span>{text.length} / 500</span>
                                        </div>
                                    </div>

                                    {/* Anonymous Checkbox */}
                                    <div className="relative z-10">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={isAnonymous}
                                                    onChange={(e) => setIsAnonymous(e.target.checked)}
                                                    className="sr-only"
                                                />
                                                <div className={cn(
                                                    "w-5 h-5 border-2 rounded transition-all flex items-center justify-center",
                                                    isAnonymous
                                                        ? "border-primary bg-primary"
                                                        : "border-slate-300 bg-white group-hover:border-primary/50"
                                                )}>
                                                    {isAnonymous && (
                                                        <svg className="w-4 h-4 text-black" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-500 group-hover:text-slate-800 transition-colors">
                                                Опубликовать анонимно
                                            </span>
                                        </label>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="relative z-10 flex gap-3">
                                        <button
                                            onClick={onClose}
                                            disabled={isLoading}
                                            className="flex-1 px-6 py-3 bg-slate-50 border border-slate-200 text-slate-600 font-black uppercase text-xs tracking-widest rounded-xl hover:bg-slate-100 transition-all disabled:opacity-50"
                                        >
                                            Отмена
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isLoading || rating === 0}
                                            className="flex-1 px-6 py-3 bg-primary text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                                    Отправка...
                                                </>
                                            ) : (
                                                <>
                                                    <Star size={16} />
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



/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { QA_EXAM_BANK, KBExamQuestion } from '@/data/kb-exam';
import { HelpCircle, CheckCircle2, XCircle, ChevronRight, Award, AlertCircle, X, BrainCircuit, RefreshCcw } from 'lucide-react';

interface KBExamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPass: () => void;
}

const QUESTIONS_PER_SESSION = 7;
const PASSING_SCORE = 6;

// Fisher-Yates Shuffle
function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function KBExamModal({ isOpen, onClose, onPass }: KBExamModalProps) {
    const [questions, setQuestions] = useState<KBExamQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // Initialize random exam session
    const initExam = () => {
        const shuffled = shuffleArray(QA_EXAM_BANK);
        setQuestions(shuffled.slice(0, QUESTIONS_PER_SESSION));
        setCurrentIndex(0);
        setSelected(null);
        setIsSubmitted(false);
        setScore(0);
        setIsFinished(false);
    };

    useEffect(() => {
        if (isOpen) {
            initExam();
        }
    }, [isOpen]);

    if (!isOpen || questions.length === 0) return null;

    const currentQ = questions[currentIndex];
    const isCorrect = selected === currentQ?.correctIndex;

    const handleSubmit = () => {
        if (selected === null) return;
        setIsSubmitted(true);
        if (selected === currentQ.correctIndex) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelected(null);
            setIsSubmitted(false);
        } else {
            setIsFinished(true);
        }
    };

    const handleComplete = () => {
        if (score >= PASSING_SCORE) {
            onPass();
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={onClose} />
            
            <div className="relative w-full max-w-3xl bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-700/50 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <BrainCircuit size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">Сертификация Саппорта</h2>
                            <p className="text-sm font-medium text-slate-400">Технический Экзамен</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {!isFinished ? (
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-hide">
                        {/* Progress */}
                        <div className="flex items-center gap-4">
                            <div className="text-sm font-black text-slate-500 whitespace-nowrap">
                                Вопрос {currentIndex + 1} / {questions.length}
                            </div>
                            <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Question */}
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                {currentQ.category}
                            </div>
                            <h3 className="text-2xl font-bold text-white leading-snug">
                                {currentQ.question}
                            </h3>
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            {currentQ.options.map((option, idx) => {
                                const isSelected = selected === idx;
                                const showSuccess = isSubmitted && idx === currentQ.correctIndex;
                                const showError = isSubmitted && isSelected && !isCorrect;

                                let btnClass = "w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-[15px] font-medium ";
                                
                                if (showSuccess) {
                                    btnClass += "bg-emerald-500/10 border-emerald-500 text-emerald-100";
                                } else if (showError) {
                                    btnClass += "bg-rose-500/10 border-rose-500 text-rose-100";
                                } else if (isSelected) {
                                    btnClass += "bg-indigo-600 border-indigo-500 text-white shadow-lg";
                                } else if (!isSubmitted) {
                                    btnClass += "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-500";
                                } else {
                                    btnClass += "bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed";
                                }

                                return (
                                    <button
                                        key={idx}
                                        disabled={isSubmitted}
                                        onClick={() => setSelected(idx)}
                                        className={btnClass}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                            showSuccess ? 'bg-emerald-500 border-emerald-400 text-white' :
                                            showError ? 'bg-rose-500 border-rose-400 text-white' :
                                            isSelected ? 'border-white bg-transparent text-white' :
                                            'border-slate-600 text-transparent'
                                        }`}>
                                            {showSuccess && <CheckCircle2 size={14} />}
                                            {showError && <XCircle size={14} />}
                                            {isSelected && !isSubmitted && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                        </div>
                                        <span className="flex-1 leading-relaxed">{option}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Explanation */}
                        {isSubmitted && (
                            <div className={`p-6 rounded-2xl border text-sm flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 ${
                                isCorrect ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-rose-900/20 border-rose-500/30'
                            }`}>
                                <div className="shrink-0">
                                    {isCorrect ? <Award size={24} className="text-emerald-400" /> : <AlertCircle size={24} className="text-rose-400" />}
                                </div>
                                <div>
                                    <strong className={`block mb-2 font-black text-base ${isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                                        {isCorrect ? 'Совершенно верно!' : 'Ошибка! Логика нарушена.'}
                                    </strong>
                                    <span className="text-slate-300 leading-relaxed text-base">{currentQ.explanation}</span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Results Screen */
                    <div className="flex-1 p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6">
                        {score >= PASSING_SCORE ? (
                            <>
                                <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 ring-8 ring-emerald-500/10">
                                    <Award size={48} />
                                </div>
                                <h2 className="text-3xl font-black text-white">Экзамен Сдан!</h2>
                                <p className="text-lg text-slate-400 max-w-sm">
                                    Вы ответили правильно на <strong className="text-emerald-400">{score} из {QUESTIONS_PER_SESSION}</strong> вопросов. Ваша компетенция подтверждена.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="w-24 h-24 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 mb-4 ring-8 ring-rose-500/10">
                                    <AlertCircle size={48} />
                                </div>
                                <h2 className="text-3xl font-black text-white">Экзамен Провален</h2>
                                <p className="text-lg text-slate-400 max-w-sm">
                                    Вы ответили правильно на <strong className="text-rose-400">{score} из {QUESTIONS_PER_SESSION}</strong> вопросов. Требуется минимум {PASSING_SCORE}.
                                </p>
                            </>
                        )}
                    </div>
                )}

                {/* Footer Controls */}
                <div className="p-6 border-t border-slate-800 bg-slate-900/80 shrink-0">
                    {!isFinished ? (
                        !isSubmitted ? (
                            <button
                                onClick={handleSubmit}
                                disabled={selected === null}
                                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all duration-300 ${
                                    selected !== null
                                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 translate-y-0'
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                                }`}
                            >
                                Проверить Ответ <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all bg-white hover:bg-slate-100 text-slate-900 shadow-xl"
                            >
                                {currentIndex < questions.length - 1 ? 'Следующий вопрос' : 'Завершить экзамен'} <ChevronRight size={16} />
                            </button>
                        )
                    ) : (
                        <div className="flex gap-4">
                            {score < PASSING_SCORE && (
                                <button
                                    onClick={initExam}
                                    className="flex-1 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest border-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCcw size={16} /> Пересдать
                                </button>
                            )}
                            <button
                                onClick={handleComplete}
                                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 ${
                                    score >= PASSING_SCORE 
                                        ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-500/20' 
                                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                                }`}
                            >
                                Вернуться в базу <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

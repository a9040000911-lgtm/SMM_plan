'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
    {
        question: "Как быстро запускаются услуги?",
        answer: "Большинство услуг (лайки, просмотры) запускаются мгновенно (в течение 1-5 минут). Подписчики могут требовать проверки модератором (до 1 часа)."
    },
    {
        question: "Это безопасно для моего аккаунта?",
        answer: "Абсолютно. Мы используем безопасные методы продвижения, которые имитируют реальную активность пользователей, что исключает блокировки."
    },
    {
        question: "Есть ли гарантия от списаний?",
        answer: "Да, на услуги с пометкой 'Гарантия' (R30, R365) действует автоматическое восстановление в течение указанного срока."
    },
    {
        question: "Как пополнить баланс?",
        answer: "Мы принимаем карты РФ, СБП, и криптовалюты. Все платежи проходят через защищенный шлюз YooKassa."
    },
    {
        question: "Можно ли отменить заказ?",
        answer: "Отмена возможна, если заказ еще не ушел в работу или возникла ошибка на стороне провайдера. Напишите в поддержку для решения вопроса."
    }
];

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="py-24 px-4 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-white mb-12">Частые вопросы</h2>
            <div className="space-y-4">
                {faqs.map((faq, idx) => (
                    <div
                        key={idx}
                        className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 hover:border-white/10"
                    >
                        <button
                            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                            className="w-full flex items-center justify-between p-6 text-left"
                        >
                            <span className="font-semibold text-gray-200">{faq.question}</span>
                            <ChevronDown
                                className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`}
                            />
                        </button>
                        <AnimatePresence>
                            {openIndex === idx && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    <div className="px-6 pb-6 text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                                        {faq.answer}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </section>
    );
}



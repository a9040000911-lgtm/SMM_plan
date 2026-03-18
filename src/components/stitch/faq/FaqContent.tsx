"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HelpCircle, Plus,
    CreditCard, Zap, ShieldCheck, ArrowRight,
    HeadphonesIcon
} from 'lucide-react';
import { cn } from '@/utils/ui';

const faqCategories = [
    {
        id: 'general',
        label: 'Общие вопросы',
        icon: HelpCircle,
        questions: [
            {
                q: 'Как работает Smmplan?',
                a: 'Smmplan — это автоматизированная платформа для продвижения в социальных сетях. Вы вставляете ссылку на ваш профиль или пост, выбираете нужную услугу, и наша система мгновенно запускает процесс привлечения аудитории или активности.'
            },
            {
                q: 'Это безопасно для моего аккаунта?',
                a: 'Да, мы используем только безопасные и проверенные методы продвижения, которые соответствуют лимитам социальных сетей. Мы никогда не запрашиваем пароли от ваших аккаунтов.'
            },
            {
                q: 'Нужна ли регистрация?',
                a: 'Вы можете сделать "Мгновенный заказ" без регистрации прямо на главной странице. Однако личный кабинет позволяет отслеживать историю заказов, получать бонусы и доступ к API.'
            }
        ]
    },
    {
        id: 'payment',
        label: 'Оплата и баланс',
        icon: CreditCard,
        questions: [
            {
                q: 'Какие способы оплаты вы принимаете?',
                a: 'Мы принимаем все популярные способы оплаты: банковские карты (МИР, Visa, Mastercard), СБП, и электронные кошельки. Все платежи защищены.'
            },
            {
                q: 'Что делать, если платеж не прошел?',
                a: 'Обычно платежи зачисляются мгновенно. Если возникла задержка более 10 минут, пожалуйста, напишите в нашу поддержку с чеком об операции, и мы всё проверим.'
            }
        ]
    },
    {
        id: 'services',
        label: 'Услуги и качество',
        icon: Zap,
        questions: [
            {
                q: 'Как быстро запускается заказ?',
                a: 'Большинство наших услуг имеют статус "Мгновенный старт", что означает запуск в течение 1-5 минут после оплаты. Точное время старта указано в описании каждой услуги.'
            },
            {
                q: 'Что такое "Premium качество"?',
                a: 'Это услуги, выполняемые активной аудиторией с заполненными профилями и реалистичной активностью. Такие услуги имеют минимальный процент списаний и максимальную эффективность для алгоритмов соцсетей.'
            }
        ]
    },
    {
        id: 'warranty',
        label: 'Гарантии и возврат',
        icon: ShieldCheck,
        questions: [
            {
                q: 'Есть ли гарантия от списаний?',
                a: 'Многие наши услуги включают гарантию на докрутку (Refill) от 30 до 365 дней. Если часть ресурсов исчезнет, система автоматически или по вашему запросу восстановит их бесплатно.'
            },
            {
                q: 'Можно ли отменить заказ?',
                a: 'Заказ можно отменить только в том случае, если он еще не был отправлен в работу нашей системой. После запуска отмена технически невозможна.'
            }
        ]
    }
];

export function FaqContent() {
    const [openIndex, setOpenIndex] = useState<string | null>('general-0');

    return (
        <div className="w-full max-w-4xl mx-auto px-6 py-12 md:py-24 space-y-16">
            {/* Header Section */}
            <header className="text-center space-y-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full font-black text-[10px] uppercase tracking-widest border border-blue-100"
                >
                    <HelpCircle size={14} />
                    Есть вопросы? У нас есть ответы
                </motion.div>
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">Помогаем разобраться</h1>
                <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                    Мы собрали самые популярные вопросы наших пользователей в одном месте. Если вы не нашли нужный ответ — наша поддержка всегда рядом.
                </p>
            </header>

            {/* FAQ List */}
            <div className="space-y-12">
                {faqCategories.map((category) => (
                    <section key={category.id} className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="p-2 bg-slate-900 text-white rounded-xl">
                                <category.icon size={18} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">{category.label}</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {category.questions.map((item, idx) => {
                                const id = `${category.id}-${idx}`;
                                const isOpen = openIndex === id;

                                return (
                                    <div
                                        key={id}
                                        className={cn(
                                            "group border-2 rounded-[2rem] transition-all duration-300 overflow-hidden",
                                            isOpen ? "bg-white border-blue-500 shadow-2xl shadow-blue-100" : "bg-white border-slate-50 hover:border-slate-200"
                                        )}
                                    >
                                        <button
                                            onClick={() => setOpenIndex(isOpen ? null : id)}
                                            className="w-full text-left px-8 py-6 flex items-center justify-between gap-4"
                                        >
                                            <span className={cn(
                                                "text-lg font-black tracking-tight transition-colors",
                                                isOpen ? "text-blue-600" : "text-slate-900"
                                            )}>
                                                {item.q}
                                            </span>
                                            <div className={cn(
                                                "shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                                isOpen ? "bg-blue-600 text-white rotate-45" : "bg-slate-100 text-slate-400"
                                            )}>
                                                <Plus size={18} />
                                            </div>
                                        </button>

                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                >
                                                    <div className="px-8 pb-8 text-slate-500 font-medium leading-relaxed italic border-t border-slate-50 pt-6">
                                                        {item.a}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>

            {/* Support CTA Section */}
            <section className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[60px] -z-0" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 text-center md:text-left">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto md:mx-0">
                            <HeadphonesIcon size={32} />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight leading-tight">Остались вопросы? <br /> Мы на связи 24/7.</h2>
                        <p className="text-blue-100 font-medium">Наши специалисты помогут в любой ситуации.</p>
                    </div>

                    <Link href="/dashboard/support" className="w-full md:w-auto">
                        <button className="w-full px-10 py-5 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-xl shadow-blue-900/20 active:scale-95">
                            Написать в поддержку <ArrowRight size={18} />
                        </button>
                    </Link>
                </div>
            </section>
        </div>
    );
}

export const FAQ_JSON_LD = faqCategories.flatMap(cat => cat.questions.map(q => ({
    "@type": "Question",
    "name": q.q,
    "acceptedAnswer": {
        "@type": "Answer",
        "text": q.a
    }
})));



'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Review {
    id: string;
    userName?: string | null;
    userRole?: string | null;
    rating: number;
    text: string | null;
    isAnonymous: boolean;
    avatarUrl?: string | null;
    user?: { username: string | null };
}

interface ReviewsCarouselProps {
    reviews: Review[];
}

const ReviewCard = memo(({ review }: { review: Review }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex-1 min-w-[300px] md:min-w-0 bg-blue-50/80 border border-blue-100/50 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 group"
    >
        <div>
            <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={14}
                        className={cn(
                            i < review.rating ? "text-amber-500 fill-amber-500" : "text-slate-200"
                        )}
                    />
                ))}
            </div>
            <p className="text-slate-700 text-sm md:text-[15px] font-semibold leading-relaxed mb-6 italic">
                {review.text || 'Отличный сервис, рекомендую!'}
            </p>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-blue-100/30">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-sm group-hover:scale-105 transition-transform">
                {review.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={review.avatarUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                    (review.userName || review.user?.username || 'A').charAt(0).toUpperCase()
                )}
            </div>
            <div className="overflow-hidden">
                <h4 className="text-sm font-bold text-slate-800 truncate">
                    {review.userName || (review.user?.username ? `@${review.user.username}` : 'Клиент')}
                </h4>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.1em] truncate">
                    {review.userRole || 'Пользователь'}
                </p>
            </div>
        </div>
    </motion.div>
));

ReviewCard.displayName = 'ReviewCard';

export const ReviewsCarousel = memo(({ reviews }: ReviewsCarouselProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const displayReviews = useMemo(() => reviews.length > 0 ? reviews : [
        { id: '1', userName: 'Алексей С.', userRole: 'Telegram-блогер', rating: 5, text: 'Перепробовал десяток сервисов, но Smmplan реально удивил. Подписчики пришли быстро.', isAnonymous: false },
        { id: '2', userName: 'Мария В.', userRole: 'SMM-специалист', rating: 5, text: "Постоянно использую для клиентских проектов. Очень выручает 'мгновенный заказ'!", isAnonymous: false },
        { id: '3', userName: 'Игорь Д.', userRole: 'Владелец бизнеса', rating: 5, text: 'Сделал пробный заказ на продвижение ВК группы. Результат превзошел ожидания.', isAnonymous: false },
    ], [reviews]);

    const showNavigation = displayReviews.length > (isMobile ? 1 : 3);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isAutoPlaying && showNavigation) {
            timerRef.current = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % displayReviews.length);
            }, 5000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isAutoPlaying, displayReviews.length, showNavigation]);

    const next = () => {
        setIsAutoPlaying(false);
        setCurrentIndex((prev) => (prev + 1) % displayReviews.length);
    };

    const prev = () => {
        setIsAutoPlaying(false);
        setCurrentIndex((prev) => (prev - 1 + displayReviews.length) % displayReviews.length);
    };

    // Slice for visibility (3 on desktop, 1 on mobile)
    const visibleRange = useMemo(() => {
        if (!showNavigation) return displayReviews;

        const items = [];
        const count = isMobile ? 1 : 3;
        for (let i = 0; i < count; i++) {
            items.push(displayReviews[(currentIndex + i) % displayReviews.length]);
        }
        return items;
    }, [currentIndex, displayReviews, showNavigation, isMobile]);

    return (
        <div className="w-full relative py-8">
            <div className="relative">
                {/* Contain with enough padding for shadows and rounded corners */}
                <div className="relative overflow-visible min-h-[280px] -m-4 p-4">
                    <div className={cn(
                        "flex gap-4 md:gap-6 w-full h-full",
                        !showNavigation && "justify-center"
                    )}>
                        <AnimatePresence mode="popLayout" initial={false}>
                            {visibleRange.map((review, idx) => (
                                <ReviewCard
                                    key={`${review.id}-${showNavigation ? currentIndex : 'static'}-${idx}`}
                                    review={review}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Navigation - Only show if enough reviews */}
                {showNavigation && (
                    <>
                        <button
                            onClick={prev}
                            className="absolute -left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white border border-blue-100 shadow-xl rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:scale-105 transition-all z-30 active:scale-95"
                            aria-label="Previous review"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={next}
                            className="absolute -right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white border border-blue-100 shadow-xl rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:scale-105 transition-all z-30 active:scale-95"
                            aria-label="Next review"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </>
                )}
            </div>

            {/* Pagination Dots - Only show if enough reviews */}
            {showNavigation && (
                <div className="flex justify-center gap-2 mt-12 pb-2">
                    {displayReviews.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => { setIsAutoPlaying(false); setCurrentIndex(i); }}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-500",
                                i === currentIndex ? "w-8 bg-blue-600" : "w-1.5 bg-blue-100"
                            )}
                            aria-label={`Go to review ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

ReviewsCarousel.displayName = 'ReviewsCarousel';

'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { cn } from '@/utils/ui';

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
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ 
            layout: { type: "spring", damping: 25, stiffness: 120 },
            opacity: { duration: 0.4 },
            x: { duration: 0.5 }
        }}
        className="flex-1 min-w-[300px] md:w-[calc(33.333%-16px)] bg-blue-50/80 border border-blue-100/50 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300 group"
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
            <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-inner group-hover:scale-105 transition-transform overflow-hidden",
                !review.avatarUrl && "bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10"
            )}>
                {review.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={review.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center">
                        <User size={18} className="text-blue-400" />
                        <div className="w-1 h-1 rounded-full bg-blue-400 mt-0.5 animate-pulse" />
                    </div>
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

    const displayReviews = useMemo(() => reviews.length > 0 ? reviews : [], [reviews]);

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
                {/* Contain with enough padding for navigation arrows and shadows */}
                <div className="relative overflow-visible min-h-[280px] -m-4 px-12 py-4">
                    {displayReviews.length === 0 ? (
                        <div className="flex items-center justify-center w-full h-full min-h-[280px]">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="text-center max-w-md glass rounded-3xl p-10 border border-blue-100/30"
                            >
                                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-500/10 flex items-center justify-center">
                                    <Star size={28} className="text-amber-400" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mb-2">Станьте первым!</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    Пока ещё никто не оставил отзыв. Поделитесь своим опытом и помогите другим сделать выбор.
                                </p>
                            </motion.div>
                        </div>
                    ) : (
                    <div className={cn(
                        "flex gap-4 md:gap-6 w-full h-full",
                        !showNavigation && "justify-center"
                    )}>
                        <AnimatePresence mode="popLayout" initial={false}>
                            {visibleRange.map((review) => (
                                <ReviewCard
                                    key={review.id}
                                    review={review}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                    )}
                </div>

                {/* Navigation - Only show if enough reviews */}
                {showNavigation && (
                    <>
                        <button
                            onClick={prev}
                            className="absolute -left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white border border-blue-100 shadow-xl rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:scale-105 transition-all z-30 active:scale-95"
                            aria-label="Previous review"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={next}
                            className="absolute -right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white border border-blue-100 shadow-xl rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:scale-105 transition-all z-30 active:scale-95"
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



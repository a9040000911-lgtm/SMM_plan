/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { Star } from 'lucide-react';

interface Props {
    rating: number;
    count: number;
    className?: string; // Additional classes
}

export const ReviewBadge: React.FC<Props> = ({ rating, count, className = "" }) => {
    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200/50 shadow-sm ${className}`}>
            <Star size={14} className="fill-yellow-500 text-yellow-500" />
            <span className="text-xs font-black tracking-widest uppercase">
                {rating} / 5
            </span>
            <span className="text-[10px] opacity-70 border-l border-yellow-200 pl-2">
                на основе {count} отзывов
            </span>
        </div>
    );
};

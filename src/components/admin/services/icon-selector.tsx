'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import {
    Users, Heart, Eye, MessageCircle, Play,
    Share2, ThumbsUp, Star, Award, Zap
} from 'lucide-react';

export const SERVICE_ICONS: Record<string, any> = {
    'Users': Users,
    'Heart': Heart,
    'Eye': Eye,
    'MessageCircle': MessageCircle,
    'Play': Play,
    'Share2': Share2,
    'ThumbsUp': ThumbsUp,
    'Star': Star,
    'Award': Award,
    'Zap': Zap
};

interface IconSelectorProps {
    value?: string;
    onChange: (iconName: string) => void;
}

export function IconSelector({ value, onChange }: IconSelectorProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {Object.entries(SERVICE_ICONS).map(([name, Icon]) => (
                <button
                    key={name}
                    onClick={() => onChange(name)}
                    className={`p-2 rounded-lg border transition-all ${value === name
                            ? 'bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300'
                        }`}
                    title={name}
                >
                    <Icon size={18} />
                </button>
            ))}
        </div>
    );
}

export function getIcon(name: string | undefined | null) {
    const Icon = name && SERVICE_ICONS[name] ? SERVICE_ICONS[name] : Users; // Default
    return <Icon size={18} />;
}



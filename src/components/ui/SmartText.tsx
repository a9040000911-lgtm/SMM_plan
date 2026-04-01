"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 */
import React from 'react';
import Link from 'next/link';

interface SmartTextProps {
    text: string;
    className?: string;
}

/**
 * Automatically converts @username and https?:// links into clickable components.
 */
export const SmartText: React.FC<SmartTextProps> = ({ text, className }) => {
    if (!text) return null;

    // Regex for @username (Telegram style) and URLs
    const regex = /(@[a-zA-Z0-9_]{5,32})|(https?:\/\/[^\s]+)/g;
    
    const parts = text.split(regex);

    return (
        <span className={className}>
            {parts.map((part, i) => {
                if (!part) return null;

                // Check if it's a @username
                if (part.startsWith('@')) {
                    const username = part.substring(1);
                    return (
                        <Link 
                            key={i} 
                            href={`https://t.me/${username}`} 
                            target="_blank" 
                            className="text-blue-500 hover:text-blue-600 hover:underline transition-colors font-bold"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </Link>
                    );
                }

                // Check if it's a URL
                if (part.startsWith('http')) {
                    return (
                        <Link 
                            key={i} 
                            href={part} 
                            target="_blank" 
                            className="text-blue-500 hover:text-blue-600 hover:underline transition-colors break-all"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </Link>
                    );
                }

                return <span key={i}>{part}</span>;
            })}
        </span>
    );
};

'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { cn } from '@/utils/ui';

interface Props {
  className?: string;
  iconSize?: number;
  showText?: boolean;
  textSize?: string;
  href?: string;
  isLink?: boolean;
  colorMode?: 'default' | 'white' | 'blue';
}

/**
 * Smmplan Collective Brand Identity Component (DBA)
 */
export const SmmplanLogo: React.FC<Props> = ({
  className,
  iconSize = 20,
  showText = true,
  textSize = "text-xl",
  href = "/",
  isLink = true,
  colorMode = 'default'
}) => {
  const content = (
    <div className={cn("flex items-center gap-2 font-black tracking-tight", className)}>
      <div className={cn(
        "bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 rotate-3",
        iconSize < 24 ? "p-1.5 rounded-md" : "p-2 rounded-xl"
      )}>
        <Sparkles 
           size={iconSize} 
           className={cn(colorMode === 'white' ? "text-blue-200" : "text-white")} 
        />
      </div>
      
      {showText && (
        <span className={cn(
            "font-black tracking-tighter",
            textSize,
            colorMode === 'default' && "bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent",
            colorMode === 'blue' && "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent",
            colorMode === 'white' && "text-white"
        )}>
          Smmplan
        </span>
      )}
    </div>
  );

  if (isLink) {
    return (
      <Link href={href} className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
};

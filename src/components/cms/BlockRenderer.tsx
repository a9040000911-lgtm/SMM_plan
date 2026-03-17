"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { PromoCarousel } from '@/components/cms/widgets/PromoCarousel';
import { PromoModal } from '@/components/cms/widgets/PromoModal';

import { useCmsBridge } from '@/components/cms/CmsBridge';

export type CmsBlock = {
    id: string;
    type: 'PROMO_CAROUSEL' | 'PROMO_MODAL' | 'CUSTOM_HTML' | 'BANNER';
    data: any;
    isActive: boolean;
    position?: 'top' | 'bottom' | 'middle';
    slot?: string;
};

interface BlockRendererProps {
    blocks: CmsBlock[];
    position?: 'top' | 'bottom' | 'middle';
    slot?: string;
}

export function BlockRenderer({ blocks, position, slot }: BlockRendererProps) {
    const { isLivePreview, liveBlocks } = useCmsBridge();
    
    // В режиме превью используем блоки из моста
    const displayBlocks = isLivePreview && liveBlocks.length > 0 ? liveBlocks : blocks;

    const activeBlocks = displayBlocks.filter(b => 
        (b.isActive || isLivePreview) && // В превью показываем даже неактивные, если они редактируются
        (!position || b.position === position) &&
        (!slot || b.slot === slot)
    );

    if (activeBlocks.length === 0) return null;

    return (
        <div className="w-full flex flex-col gap-8">
            {activeBlocks.map(block => {
                const blockData = block.content || block.data;
                const wrapper = (children: React.ReactNode) => (
                    <div key={block.id} data-cms-key={`block.${block.id}`} className="w-full relative group/block">
                        {children}
                    </div>
                );

                switch (block.type) {
                    case 'PROMO_CAROUSEL':
                        return wrapper(<PromoCarousel data={blockData} />);
                    case 'PROMO_MODAL':
                        return wrapper(<PromoModal data={blockData} />);
                    default:
                        return null;
                }
            })}
        </div>
    );
}

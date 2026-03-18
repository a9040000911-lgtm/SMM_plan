'use client';

/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface CmsBridgeContextType {
    isLivePreview: boolean;
    liveStrings: Record<string, string>;
    liveBlocks: any[];
}

const CmsBridgeContext = createContext<CmsBridgeContextType>({
    isLivePreview: false,
    liveStrings: {},
    liveBlocks: [],
});

export const useCmsBridge = () => useContext(CmsBridgeContext);

export function CmsBridgeProvider({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams();
    const isLivePreview = searchParams.get('cms_preview') === 'true';
    const [liveStrings, setLiveStrings] = useState<Record<string, string>>({});
    const [liveBlocks, setLiveBlocks] = useState<any[]>([]);

    useEffect(() => {
        if (!isLivePreview) return;

        console.log('CMS Bridge: Live Preview Mode Active');

        const handleMessage = (event: MessageEvent) => {
            // Security: Always validate origin in production
            const allowedOrigins = [window.location.origin];
            if (!allowedOrigins.includes(event.origin) && process.env.NODE_ENV === 'production') {
                return;
            }

            if (event.data?.type === 'CMS_LIVE_UPDATE') {
                const { strings, blocks } = event.data.payload;
                if (strings) setLiveStrings(strings);
                if (blocks) setLiveBlocks(blocks);
            }
        };

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const cmsElement = target.closest('[data-cms-key]');
            
            if (cmsElement) {
                const key = cmsElement.getAttribute('data-cms-key');
                if (key && window.parent !== window) {
                    window.parent.postMessage({ 
                        type: 'CMS_ELEMENT_SELECTED', 
                        payload: { key } 
                    }, window.location.origin); // Restrict target origin
                }
            }
        };

        window.addEventListener('message', handleMessage);
        window.addEventListener('click', handleClick, true);
        
        if (window.parent !== window) {
            window.parent.postMessage({ type: 'CMS_PREVIEW_READY' }, window.location.origin);
        }

        return () => {
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('click', handleClick, true);
        };
    }, [isLivePreview]);

    return (
        <CmsBridgeContext.Provider value={{ isLivePreview, liveStrings, liveBlocks }}>
            <style dangerouslySetInnerHTML={{ __html: `
                [data-cms-key] {
                    cursor: pointer !important;
                    position: relative;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                [data-cms-key]:hover {
                    outline: 2px solid #3b82f6 !important;
                    outline-offset: 4px !important;
                    backgroundColor: rgba(59, 130, 246, 0.05) !important;
                    border-radius: 4px;
                    z-index: 50;
                }
                [data-cms-key]:hover::after {
                    content: 'Click to edit';
                    position: absolute;
                    top: -24px;
                    right: 0;
                    background: #3b82f6;
                    color: white;
                    font-size: 10px;
                    font-weight: 900;
                    padding: 2px 8px;
                    border-radius: 4px;
                    text-transform: uppercase;
                    pointer-events: none;
                }
                [contenteditable="true"]:focus {
                    outline: 2px solid #22c55e !important;
                    outline-offset: 4px !important;
                    background: white !important;
                    color: black !important;
                    box-shadow: 0 10px 50px rgba(0,0,0,0.1) !important;
                }
            `}} />
            {children}
            {isLivePreview && (
                <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none">
                    <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl text-white px-4 py-2 rounded-2xl text-[10px] font-black tracking-widest border border-white/10 shadow-2xl overflow-hidden">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        CMS STUDIO • CONNECTED
                    </div>
                </div>
            )}
        </CmsBridgeContext.Provider>
    );
}



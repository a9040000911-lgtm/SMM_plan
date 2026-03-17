'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import { updateCmsStringsAction, updateCmsBlocksAction } from '../actions';
import { toast } from 'sonner';
import { CMS_GROUPS, ViewportSize } from '../types';

interface UseCmsEditorProps {
    projectId: string;
    initialStrings: Record<string, string>;
    initialBlocks: any[];
}

export function useCmsEditor({ projectId, initialStrings, initialBlocks }: UseCmsEditorProps) {
    const [isPending, startTransition] = useTransition();
    const [activePage, setActivePage] = useState('home');
    const [strings, setStrings] = useState(initialStrings);
    const [blocks, setBlocks] = useState<any[]>(initialBlocks);
    const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop');
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [isPageMenuOpen, setIsPageMenuOpen] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Live Sync with Iframe
    useEffect(() => {
        const sendUpdate = () => {
            if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage({
                    type: 'CMS_LIVE_UPDATE',
                    payload: { strings, blocks }
                }, window.location.origin);
            }
        };
        const timer = setTimeout(sendUpdate, 100);
        return () => clearTimeout(timer);
    }, [strings, blocks, activePage]);

    // Handle messages from iframe (Inline Edit & Selection)
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Security: origin check
            if (event.origin !== window.location.origin) return;

            if (event.data?.type === 'CMS_INLINE_CHANGE') {
                const { key, value } = event.data.payload;
                setStrings(prev => ({ ...prev, [key]: value }));
            }
            if (event.data?.type === 'CMS_ELEMENT_SELECTED') {
                const { key } = event.data.payload;
                setSelectedKey(key);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Global keyboard shortcuts
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                handleSaveAll();
            }
            if (e.key === 'Escape') {
                setSelectedKey(null);
                setIsPageMenuOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [strings, blocks]);

    const findKeyConfig = useCallback((key: string) => {
        if (key.startsWith('block.')) {
            const blockId = key.replace('block.', '');
            const block = blocks.find(b => b.id === blockId);
            if (block) {
                return {
                    key,
                    label: `Блок: ${block.type}`,
                    description: 'Настройте параметры выбранного виджета',
                    type: 'block'
                };
            }
        }

        for (const g of CMS_GROUPS) {
            const found = g.keys.find(k => k.key === key);
            if (found) return { ...found, group: g.label };
        }
        return null;
    }, [blocks]);

    const addBlock = (type: string, slot: string = 'DEFAULT') => {
        const newBlock = {
            id: 'temp-' + Date.now(),
            type,
            slot,
            data: {}
        };
        setBlocks([...blocks, newBlock]);
        toast.success(`Блок ${type} добавлен`);
    };

    const handleSaveAll = async () => {
        startTransition(async () => {
            try {
                const results = await Promise.all([
                    updateCmsStringsAction(projectId, strings, activePage),
                    updateCmsBlocksAction(projectId, activePage, blocks)
                ]);

                if (results.every(r => r.success)) {
                    toast.success('Все изменения сохранены и опубликованы!');
                } else {
                    toast.error('Ошибка при сохранении части данных');
                }
            } catch (e: any) {
                toast.error('Критическая ошибка: ' + e.message);
            }
        });
    };

    return {
        state: {
            activePage,
            strings,
            blocks,
            viewportSize,
            selectedKey,
            isPageMenuOpen,
            isPending,
            iframeRef
        },
        actions: {
            setActivePage,
            setStrings,
            setBlocks,
            setViewportSize,
            setSelectedKey,
            setIsPageMenuOpen,
            handleSaveAll,
            addBlock,
            findKeyConfig
        }
    };
}

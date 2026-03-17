'use client';

import React, { useState } from 'react';
import { 
    Layout, 
    Type, 
    Image as ImageIcon, 
    History, 
    X, 
    Plus, 
    Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditorToolbar } from './components/EditorToolbar';
import { PropertyDrawer } from './components/PropertyDrawer';
import { useCmsEditor } from './hooks/useCmsEditor';
import { SLOTS } from './types';

export default function CmsAdmin({ project, initialStrings, initialBlocks }: { project: any, initialStrings: Record<string, string>, initialBlocks: any[] }) {
    const [activeTab, setActiveTab] = useState<'strings' | 'widgets' | 'media'>('strings');
    
    const { state, actions } = useCmsEditor({
        projectId: project.id,
        initialStrings,
        initialBlocks
    });

    const {
        activePage,
        strings,
        blocks,
        viewportSize,
        selectedKey,
        isPageMenuOpen,
        isPending,
        iframeRef
    } = state;

    const {
        setActivePage,
        setBlocks,
        setViewportSize,
        setSelectedKey,
        setIsPageMenuOpen,
        handleSaveAll,
        addBlock,
        findKeyConfig
    } = actions;

    return (
        <div className="fixed inset-0 top-[70px] bg-slate-50 flex flex-col overflow-hidden">
            <EditorToolbar 
                activePage={activePage}
                viewportSize={viewportSize}
                isPending={isPending}
                isPageMenuOpen={isPageMenuOpen}
                onPageSelect={setActivePage}
                onViewportChange={setViewportSize}
                onSave={handleSaveAll}
                onTogglePageMenu={() => setIsPageMenuOpen(!isPageMenuOpen)}
            />

            <div className="flex-1 relative flex">
                {/* Floating Navigation Menu */}
                <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col gap-3 z-50">
                    {[
                        { id: 'strings', icon: <Type size={20} />, label: 'Тексты' },
                        { id: 'widgets', icon: <Layout size={20} />, label: 'Виджеты' },
                        { id: 'media', icon: <ImageIcon size={20} />, label: 'Медиа' },
                        { id: 'history', icon: <History size={20} />, label: 'История' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as any);
                                setSelectedKey(null);
                            }}
                            className={cn(
                                "p-4 rounded-2xl transition-all shadow-xl group relative flex items-center",
                                activeTab === tab.id ? "bg-slate-950 text-white scale-110" : "bg-white text-slate-400 hover:text-slate-900"
                            )}
                        >
                            {tab.icon}
                            <span className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-2xl">
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Main Canvas Area */}
                <div className="flex-1 bg-slate-200/50 p-12 flex items-center justify-center overflow-hidden relative">
                    <div 
                        className={cn(
                            "bg-white shadow-[0_0_100px_rgba(0,0,0,0.1)] transition-all duration-700 ease-in-out relative origin-center",
                            viewportSize === 'desktop' ? "w-full h-full rounded-2xl" : "w-[390px] h-[844px] rounded-[3rem] border-[12px] border-slate-900"
                        )}
                    >
                        {viewportSize === 'mobile' && (
                            <div className="h-6 bg-slate-900 flex justify-between px-8 items-center rounded-t-[2.2rem]">
                                <div className="text-[10px] text-white font-bold">9:41</div>
                                <div className="flex gap-1.5 items-center">
                                    <div className="w-4 h-2 bg-white/40 rounded-sm" />
                                    <div className="w-3 h-3 bg-white/40 rounded-full" />
                                </div>
                            </div>
                        )}
                        
                        <iframe 
                            ref={iframeRef}
                            src={`/${activePage === 'home' ? '' : activePage}?cms_preview=true`}
                            className={cn(
                                "w-full border-none transition-all duration-300",
                                viewportSize === 'desktop' ? "h-full rounded-2xl" : "h-[calc(100%-24px)]"
                            )}
                        />
                    </div>
                </div>

                {/* Properties Drawer */}
                <PropertyDrawer 
                    selectedKey={selectedKey}
                    strings={strings}
                    onClose={() => setSelectedKey(null)}
                    onStringChange={(key, value) => {
                        actions.setStrings(prev => ({ ...prev, [key]: value }));
                    }}
                    findKeyConfig={findKeyConfig}
                />

                {/* Global Widgets Overlay */}
                {activeTab === 'widgets' && !selectedKey && (
                     <div className="fixed inset-y-0 right-0 w-[440px] bg-white shadow-[-50px_0_100px_rgba(0,0,0,0.1)] z-[60] animate-in slide-in-from-right flex flex-col border-l border-slate-100">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Виджеты & Блоки</h2>
                            <button onClick={() => setActiveTab('strings')} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => addBlock('PROMO_CAROUSEL')} className="flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-3xl hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100 group">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600 group-hover:scale-110 transition-transform"><Plus size={20} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Carousel</span>
                                </button>
                                <button onClick={() => addBlock('PROMO_MODAL')} className="flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-3xl hover:bg-purple-50 transition-all border border-transparent hover:border-purple-100 group">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm text-purple-600 group-hover:scale-110 transition-transform"><Plus size={20} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Modal</span>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {blocks.map((block, i) => (
                                    <div key={block.id} className="bg-slate-50/50 rounded-3xl border border-slate-100 p-6 space-y-4 group/widget relative">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="text-[9px] font-black text-slate-300">0{i+1}</div>
                                                <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{block.type}</div>
                                            </div>
                                            <button onClick={() => setBlocks(blocks.filter(b => b.id !== block.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                                        </div>
                                        <select 
                                            value={block.slot} 
                                            onChange={(e) => setBlocks(blocks.map(b => b.id === block.id ? { ...b, slot: e.target.value } : b))}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                                        >
                                            {SLOTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                     </div>
                )}
            </div>
        </div>
    );
}

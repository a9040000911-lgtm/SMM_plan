'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Plus, FileText, Globe, Pencil, X } from 'lucide-react';
import { LegalDocumentForm } from './LegalDocumentForm';
import { DeleteDocumentButton } from './DeleteDocumentButton';
import { useLanguage } from '@/providers/language-provider';

interface Props {
    projectId: string;
    initialDocuments: any[];
}

export function LegalContentManager({ projectId, initialDocuments }: Props) {
    const { t, lang } = useLanguage();
    const lt = t.admin.legal_ui;
    const [editingDoc, setEditingDoc] = useState<any | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const closeModal = () => {
        setEditingDoc(null);
        setIsCreateModalOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* HEADER WITH CREATE BUTTON */}
            <div className="flex items-center justify-between px-4">
                <h3 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-slate-400">
                    <FileText size={16} /> {lt.list_title} ({initialDocuments.length})
                </h3>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95"
                >
                    <Plus size={14} /> {lt.create_btn}
                </button>
            </div>

            {/* LIST SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {initialDocuments.length === 0 && (
                    <div className="md:col-span-2 bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center">
                        <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-400 font-medium text-sm">{lt.empty_state}</p>
                    </div>
                )}

                {initialDocuments.map((doc) => (
                    <div key={doc.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm transition-all p-8 group hover:border-blue-200 hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h4 className="font-bold text-lg text-slate-800">{doc.title}</h4>
                                    {!doc.isActive && (
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-full tracking-wider">
                                            {lt.draft_badge}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                                    <Globe size={12} /> {doc.slug}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setEditingDoc(doc)}
                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                                >
                                    <Pencil size={18} />
                                </button>
                                <DeleteDocumentButton id={doc.id} />
                            </div>
                        </div>

                        <div className="mt-6 border-t border-slate-100 pt-6">
                            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed whitespace-pre-wrap italic">
                                {doc.content}
                            </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-[10px] text-slate-300 uppercase font-bold tracking-widest">
                            <span>{lt.updated_at}: {new Date(doc.updatedAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')}</span>
                            <span className="hidden sm:inline text-slate-200">ID: {doc.id}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL OVERLAY */}
            {(isCreateModalOpen || editingDoc) && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">
                                    {editingDoc ? lt.edit_modal : lt.new_modal}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                    {editingDoc ? editingDoc.title : lt.modal_subtitle}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <LegalDocumentForm
                                projectId={projectId}
                                initialData={editingDoc}
                                onCancel={closeModal}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



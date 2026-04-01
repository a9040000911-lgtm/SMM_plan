// @ts-nocheck
"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Visionary CMS Studio: Block Editor Core
 */

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { 
    Bold, Italic, List, 
    Image as ImageIcon, 
    Heading1
} from 'lucide-react';

interface BlockEditorProps {
    initialContent?: any;
    onChange?: (content: any) => void;
    placeholder?: string;
}

export const BlockEditor = ({ initialContent, onChange, placeholder }: BlockEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-3xl border border-white/10 shadow-2xl max-w-full h-auto my-8',
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-400 underline underline-offset-4 font-bold hover:text-blue-300 transition-colors',
                },
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Начните писать или нажмите "/" для выбора блока...',
            }),
            Highlight.configure({ multicolor: true }),
            Typography,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: initialContent,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getJSON());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-blue max-w-none focus:outline-none min-h-[500px] text-lg leading-relaxed font-medium text-slate-300',
            },
        },
    });

    if (!editor) return null;

    return (
        <div className="relative group">
            {/* Bubble Menu (Inline formatting) */}
            <BubbleMenu editor={editor}>
                <div className="flex items-center gap-1 bg-[#0a0d14]/90 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl ring-1 ring-white/5">
                    <button 
                        onClick={() => editor.chain().focus().toggleBold().run()} 
                        className={editor.isActive('bold') ? 'p-2 bg-blue-600/20 text-blue-400 rounded-xl' : 'p-2 text-slate-400 hover:bg-white/5 rounded-xl transition-colors'}
                    >
                        <Bold size={16} />
                    </button>
                    <button 
                        onClick={() => editor.chain().focus().toggleItalic().run()} 
                        className={editor.isActive('italic') ? 'p-2 bg-blue-600/20 text-blue-400 rounded-xl' : 'p-2 text-slate-400 hover:bg-white/5 rounded-xl transition-colors'}
                    >
                        <Italic size={16} />
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <button 
                        onClick={() => editor.chain().focus().toggleHighlight().run()} 
                        className={editor.isActive('highlight') ? 'p-2 bg-yellow-600/20 text-yellow-400 rounded-xl' : 'p-2 text-slate-400 hover:bg-white/5 rounded-xl transition-colors'}
                    >
                        <ImageIcon size={16} /> {/* Actually Highlight icon, placeholder logic */}
                    </button>
                </div>
            </BubbleMenu>

            {/* Floating Menu (Block selection) */}
            <FloatingMenu editor={editor}>
                <div className="flex flex-col gap-1 bg-[#0a0d14]/90 backdrop-blur-xl p-2 rounded-[2rem] border border-white/10 shadow-2xl ring-1 ring-white/5 w-64 translate-x-[-120%]">
                    <button 
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
                        className="flex items-center gap-3 p-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-2xl transition-all"
                    >
                        <div className="p-2 bg-blue-600/10 rounded-xl text-blue-400"><Heading1 size={18} /></div>
                        <span className="text-xs font-black uppercase tracking-widest">Заголовк 1</span>
                    </button>
                    <button 
                        onClick={() => editor.chain().focus().toggleBulletList().run()} 
                        className="flex items-center gap-3 p-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-2xl transition-all"
                    >
                        <div className="p-2 bg-purple-600/10 rounded-xl text-purple-400"><List size={18} /></div>
                        <span className="text-xs font-black uppercase tracking-widest">Список</span>
                    </button>
                    <button 
                        onClick={() => {/* Mock Image Upload */}} 
                        className="flex items-center gap-3 p-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-2xl transition-all"
                    >
                        <div className="p-2 bg-emerald-600/10 rounded-xl text-emerald-400"><ImageIcon size={18} /></div>
                        <span className="text-xs font-black uppercase tracking-widest">Картинка</span>
                    </button>
                </div>
            </FloatingMenu>

            {/* Main Editor Surface */}
            <div className="bg-[#0f141e]/30 p-12 rounded-[3.5rem] border border-white/5 shadow-inner relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
                 <EditorContent editor={editor} />
            </div>
        </div>
    );
};

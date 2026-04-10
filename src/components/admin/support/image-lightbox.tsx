"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, ZoomIn, ZoomOut, Maximize2, Search } from 'lucide-react';

export function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Clamp position within boundaries to prevent image from flying off-screen
    const applyBounds = (newPos: { x: number; y: number }, newScale: number) => {
        if (!imgRef.current) return newPos;

        const w = imgRef.current.clientWidth * newScale;
        const h = imgRef.current.clientHeight * newScale;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const overflowX = Math.max(0, (w - vw) / 2);
        const overflowY = Math.max(0, (h - vh) / 2);

        return {
            x: Math.min(Math.max(newPos.x, -overflowX), overflowX),
            y: Math.min(Math.max(newPos.y, -overflowY), overflowY)
        };
    };

    // Zoom at specific point (cursor)
    const handleZoom = (newScale: number, mouseX: number, mouseY: number) => {
        const currentScale = scale;
        const boundedScale = Math.min(Math.max(0.5, newScale), 8);

        if (boundedScale === currentScale) return;

        // Calculate world coordinates of the mouse point relative to current position
        const worldX = (mouseX - window.innerWidth / 2 - position.x) / currentScale;
        const worldY = (mouseY - window.innerHeight / 2 - position.y) / currentScale;

        // Calculate new position
        const newPos = {
            x: mouseX - window.innerWidth / 2 - worldX * boundedScale,
            y: mouseY - window.innerHeight / 2 - worldY * boundedScale
        };

        setScale(boundedScale);
        setPosition(applyBounds(newPos, boundedScale));
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = e.deltaY > 0 ? 0.8 : 1.25;
        handleZoom(scale * delta, e.clientX, e.clientY);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 0.1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            const newPos = {
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            };
            setPosition(applyBounds(newPos, scale));
        }
    };

    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleMouseUp = () => setIsDragging(false);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-default overflow-hidden"
            onClick={onClose}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Top controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-[310]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-md p-1 border border-white/10">
                    <button
                        onClick={() => handleZoom(scale * 0.7, window.innerWidth / 2, window.innerHeight / 2)}
                        className="p-2 hover:bg-white/10 rounded-md text-white transition-colors"
                        title="Уменьшить"
                    >
                        <ZoomOut size={20} />
                    </button>
                    <span className="text-white text-[10px] font-black w-14 text-center uppercase tracking-tighter">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={() => handleZoom(scale * 1.5, window.innerWidth / 2, window.innerHeight / 2)}
                        className="p-2 hover:bg-white/10 rounded-md text-white transition-colors"
                        title="Увеличить"
                    >
                        <ZoomIn size={20} />
                    </button>
                    <div className="w-px h-4 bg-white/20 mx-1" />
                    <button
                        onClick={handleReset}
                        className="p-2 hover:bg-white/10 rounded-md text-white transition-colors"
                        title="Сбросить (Double Click)"
                    >
                        <Maximize2 size={20} />
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 bg-rose-500 hover:bg-rose-600 rounded-md text-white transition-colors shadow-lg active:scale-95"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Hint */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-white/60 text-[10px] uppercase font-bold tracking-widest pointer-events-none select-none">
                <Search size={12} className="text-white/40" />
                Кликните для зума • Тяните для перемещения • Скролл для масштаба
            </div>

            <div
                className="relative will-change-transform"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transition: isDragging ? 'none' : 'transform 150ms ease-out',
                    cursor: isDragging ? 'grabbing' : (scale > 1 ? 'grab' : 'zoom-in')
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (scale === 1) {
                        handleZoom(2.5, e.clientX, e.clientY);
                    } else {
                        handleReset();
                    }
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                }}
            >
                <Image
                    ref={imgRef}
                    src={src}
                    alt="Preview"
                    width={1920}
                    height={1080}
                    className="max-w-[85vw] max-h-[85vh] object-contain rounded-sm shadow-[0_0_100px_rgba(0,0,0,0.5)] select-none pointer-events-none"
                    onLoad={() => {
                        // Optional: Center or fit on load if needed
                    }}
                />
            </div>
        </div>
    );
}

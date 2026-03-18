"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export const HeroForm = () => {
    const [link, setLink] = useState("");
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (link) {
            // Redirect to main checkout flow but keeping the user context if possible
            // For now, redirect to the standard processing page
            router.push(`/?url=${encodeURIComponent(link)}`);
        }
    };

    return (
        <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-purple-900/50 to-neutral-900 overflow-hidden relative group p-6 flex flex-col justify-end">
            <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(to_bottom,transparent,black)]"></div>

            <div className="relative z-10 w-full">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Analyze & Promote
                </h3>

                <form onSubmit={handleSubmit} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                    <div className="relative flex items-center bg-black rounded-lg p-1">
                        <Search className="h-5 w-5 text-gray-400 ml-3" />
                        <input
                            type="text"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="Instagram / Telegram / YouTube link..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 text-sm px-3 py-2"
                        />
                        <button
                            type="submit"
                            className="bg-white text-black rounded-md p-2 hover:bg-gray-200 transition-colors"
                        >
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </form>
                <div className="mt-3 flex gap-2 text-[10px] text-gray-400 font-mono">
                    <span className="px-2 py-1 bg-white/5 rounded border border-white/5">INSTAGRAM</span>
                    <span className="px-2 py-1 bg-white/5 rounded border border-white/5">TELEGRAM</span>
                    <span className="px-2 py-1 bg-white/5 rounded border border-white/5">TIKTOK</span>
                </div>
            </div>
        </div>
    );
};



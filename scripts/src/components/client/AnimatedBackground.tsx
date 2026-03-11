"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

export const AnimatedBackground: React.FC = () => {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    if (isLight) return null; // Clean background for light mode

    return (
        <div className="fixed inset-0 -z-50 overflow-hidden bg-[#02040a]">
            {/* Main Cyber Grid */}
            <div
                className="absolute inset-0 cyber-grid opacity-20 pointer-events-none"
                style={{
                    perspective: "1000px",
                    transformStyle: "preserve-3d"
                }}
            >
                <motion.div
                    animate={{
                        y: ["0px", "40px"],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute inset-0 cyber-grid"
                    style={{
                        transform: "rotateX(60deg) scale(2) translateY(-20%)",
                    }}
                />
            </div>

            {/* Glowing Scanlines */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ top: "-10%" }}
                        animate={{ top: "110%" }}
                        transition={{
                            duration: 8 + i * 2,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 3
                        }}
                        className="absolute left-0 right-0 h-[100px] bg-gradient-to-b from-transparent via-primary/5 to-transparent"
                    />
                ))}
            </div>

            {/* Radial Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,4,10,0.8)_80%,#02040a_100%)]" />

            {/* Subtle Noise/Grit Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZUZpbHRlciI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2VGaWx0ZXIpIiBvcGFjaXR5PSIwLjUiLz48L3N2Zz4=')]" />
        </div>
    );
};

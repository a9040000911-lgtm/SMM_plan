/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-[100] bg-[#02040a] overflow-auto">
            <div className="relative min-h-full pb-32">
                {children}
            </div>
        </div>
    );
}



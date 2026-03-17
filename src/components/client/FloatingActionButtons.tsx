"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from "react";
import { Star, Bug } from "lucide-react";
import { motion } from "framer-motion";
import { BugReportModal } from "./BugReportModal";
import { ReviewModal } from "./ReviewModal";

interface FloatingActionButtonsProps {
    enableBugReporter?: boolean;
    enableReviews?: boolean;
}

export const FloatingActionButtons = ({ enableBugReporter = true, enableReviews = true }: FloatingActionButtonsProps) => {
    const [showBugModal, setShowBugModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);

    if (!enableBugReporter && !enableReviews) return null;

    return (
        <>
            {/* Floating Buttons Container */}
            <div className="fixed bottom-24 md:bottom-6 right-6 z-40 flex flex-col gap-3">
                {/* Review Button */}
                {enableReviews && (
                    <motion.button
                        onClick={() => setShowReviewModal(true)}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-14 h-14 bg-primary text-black rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:shadow-primary/50 transition-all group relative"
                    >
                        <Star size={24} className="fill-current" />
                        <div className="absolute right-full mr-3 bg-primary text-black px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            Отзывы
                        </div>
                    </motion.button>
                )}

                {/* Bug Report Button */}
                {enableBugReporter && (
                    <motion.button
                        onClick={() => setShowBugModal(true)}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-center hover:shadow-orange-500/50 transition-all group relative"
                    >
                        <Bug size={24} />
                        <div className="absolute right-full mr-3 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            Нашли баг?
                        </div>
                    </motion.button>
                )}
            </div>

            {/* Modals */}
            <BugReportModal isOpen={showBugModal} onClose={() => setShowBugModal(false)} />
            <ReviewModal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} />
        </>
    );
};

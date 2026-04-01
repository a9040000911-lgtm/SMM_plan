/**
 * SMM Plan | Animation Vault 1.0
 * Centeralized Framer Motion Variants for Visionary UI
 */

import { Variants } from "framer-motion";

export const premiumSpring = {
    type: "spring" as const,
    damping: 25,
    stiffness: 120,
    mass: 1,
    restDelta: 0.001
};

export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.2
        }
    }
};

export const fadeInUp: Variants = {
    hidden: { 
        opacity: 0, 
        y: 30,
        filter: "blur(10px)"
    },
    show: { 
        opacity: 1, 
        y: 0,
        filter: "blur(0px)",
        transition: premiumSpring
    }
};

export const scaleIn: Variants = {
    hidden: { 
        opacity: 0, 
        scale: 0.9,
        filter: "blur(10px)"
    },
    show: { 
        opacity: 1, 
        scale: 1,
        filter: "blur(0px)",
        transition: premiumSpring
    }
};

export const glassHover = {
    initial: { 
        scale: 1,
        boxShadow: "0 0 0 rgba(110, 168, 255, 0)"
    },
    hover: { 
        scale: 1.02,
        boxShadow: "0 20px 40px rgba(110, 168, 255, 0.15)",
        transition: {
            type: "spring" as const,
            stiffness: 400,
            damping: 10
        }
    },
    tap: { 
        scale: 0.98 
    }
};

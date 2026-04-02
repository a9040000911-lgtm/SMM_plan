/**
 * SMM Plan | Instant Order Evolution 4.8
 * Refactored by Visionary UI Architect
 * - Unified Ordering Hub (Catalog & Quick Analysis)
 * - Premium Design & Compact Layout
 * - Quantity Multiplicity Validation
 * - Integrated Service Details (Info) Overlay
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import Link from "next/link";
import { 
  X, ChevronRight, ChevronLeft, Zap, ShieldCheck, Link2, Layers, Mail, CheckCircle2, ShoppingBag, Flame, Star, AlertCircle, Info, AlertTriangle, ChevronDown, Heart, User, LogOut, ExternalLink, Activity, LayoutTemplate, Box, Clock, Banknote, HelpCircle, Key, Plus, Copy, Command, Settings2, Sparkles, ListFilter, ArrowUpRight, Target, Search, Fingerprint, Share2, Globe, Shield, RefreshCw, BarChart3, PieChart, Server, Check, Eye, EyeOff, SearchCode, DollarSign, Calendar, SlidersHorizontal, Lock, ArrowLeft, ArrowRight, ArrowDownToLine, MoveRight, LayoutGrid, List, Star as StarIcon, RotateCcw, Rocket
} from 'lucide-react';
import { toast } from "sonner";
import { getInstantServices } from "@/app/_actions/services/getInstantServices";
import { 
  staggerContainer, 
  fadeInUp, 
  scaleIn 
} from '@/utils/animation-variants';
import { useSession, signIn } from "next-auth/react";
import { cn } from "@/utils/ui";
import { formatUnitPrice, formatCartTotal, formatCartTotalRaw } from "@/utils/formatter";
import { translateCategory, translatePlatform, translateTargetType } from "@/utils/translations";
import { analyzeLink, mapObjectTypeToTargetType } from "@/utils/link-analyzer";
import { BrandIcon } from "../ui/BrandIcon";

// ─── Neuro-UX: Semantic Name Cleaner ────────────────────────────────────────
// Removes technical jargon from service names for clean H2 display
function cleanServiceName(rawName: string): string {
    // Step 1: Strip leading tier tags like [Микс] [Стандарт] etc - keep them for suffix
    const tierMatch = rawName.match(/^\[([^\]]+)\]\s*/);
    const tierTag = tierMatch ? tierMatch[1].trim() : null;
    let cleaned = tierMatch ? rawName.slice(tierMatch[0].length) : rawName;
    
    // Step 2: Remove trailing technical blocks [... | ... | ...]
    cleaned = cleaned.replace(/\s*\[[^\]]{10,}\]\s*$/g, '');
    
    // Step 3: Remove remaining bracket noise at the end (short tags left)
    cleaned = cleaned.replace(/\s*\[[^\]]+\]\s*$/g, '');
    
    // Step 4: Title-case the result
    cleaned = cleaned.trim().replace(/\b([A-ZА-ЯЁ])([A-ZА-ЯЁ]+)/g, (_, first, rest) => first + rest.toLowerCase());
    
    // Step 5: Append tier as suffix if found
    if (tierTag && tierTag.toUpperCase() !== cleaned.split(' ')[0]?.toUpperCase()) {
        cleaned = `${cleaned} — ${tierTag.charAt(0).toUpperCase() + tierTag.slice(1).toLowerCase()}`;
    }
    
    return cleaned || rawName;
}

// ─── Neuro-UX: Dynamic Badge Parser ─────────────────────────────────────────
// Extracts guarantee, dropoff, and speed info from service data  
function parseServiceMeta(service: SmmService) {
    const name = (service.name || '').toUpperCase();
    
    // Guarantee
    let guarantee = 'Стандартная';
    let guaranteeColor: 'emerald' | 'rose' = 'emerald';
    if (name.includes('БЕЗ ГАРАНТ')) { guarantee = 'Без гарантии'; guaranteeColor = 'rose'; }
    else if (name.includes('ВЕЧНАЯ') || name.includes('ПОЖИЗН')) guarantee = 'Навсегда';
    else if (name.includes('ГАРАНТ')) guarantee = 'Есть';
    
    // Dropoff  
    let dropoff = 'Минимальные';
    let dropoffColor: 'emerald' | 'amber' = 'emerald';
    const dropMatch = name.match(/СПИСАНИ[ЯЕ]\s*(\d+[-–]?\d*)%/i);
    if (dropMatch) {
        const val = dropMatch[1];
        dropoff = `До ${val}%`;
        const maxDrop = parseInt(val.split(/[-–]/).pop() || '0');
        dropoffColor = maxDrop > 10 ? 'amber' : 'emerald';
    } else if (name.includes('БЕЗ СПИСАН')) {
        dropoff = 'Нет';
    }
    
    // Quality
    const quality = service.quality === 'HIGH' ? 'Премиум' : 'Стандарт';
    const qualityColor: 'amber' | 'slate' = service.quality === 'HIGH' ? 'amber' : 'slate';
    
    return { guarantee, guaranteeColor, dropoff, dropoffColor, quality, qualityColor };
}

const PLATFORMS = {
    TELEGRAM: 'Telegram',
    INSTAGRAM: 'Instagram',
    VK: 'VK',
    YOUTUBE: 'YouTube',
    TIKTOK: 'TikTok',
    TWITTER: 'Twitter',
    FACEBOOK: 'Facebook',
    THREADS: 'Threads',
    DISCORD: 'Discord',
    REDDIT: 'Reddit',
    LINKEDIN: 'LinkedIn',
    PINTEREST: 'Pinterest',
    SNAPCHAT: 'Snapchat',
    KICK: 'Kick',
    RUTUBE: 'Rutube',
    DZEN: 'Dzen',
    STEAM: 'Steam',
    GOOGLE: 'Google',
    TROVO: 'Trovo',
    YANDEX: 'Yandex',
    WEBSITE: 'Website'
} as const;

interface InstantOrderProps {
    initialLink?: string;
    initialServiceId?: string;
    initialPlatform?: string;
    isExpanded: boolean;
    onExpandChange: (expanded: boolean) => void;
    globalStats?: {
        formatted: { orders: string; users: string };
    } | null;
}

interface SmmService {
    id: string;
    numericId?: string;
    name: string;
    description?: string;
    requirements?: string;
    pricePer1000: number;
    category: string;
    platform: string;
    minQty: number;
    maxQty?: number;
    qtyStep?: number;
    targetType?: string;
    isHot?: boolean;
    isCheap?: boolean;
    isBest?: boolean;
    quality?: "HIGH" | "STD";
}

const CategorySection = React.memo(({
    categories,
    selectedCategory,
    onSelect
}: {
    categories: string[];
    selectedCategory: string | null;
    onSelect: (cat: string) => void;
}) => {
    return (
        <>
            {/* Desktop Categories */}
            <div className="hidden lg:flex flex-col w-64 shrink-0 space-y-6">
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4">Доступные Категории</h3>
                    <div className="flex flex-col gap-1.5">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => onSelect(cat)}
                                className={cn(
                                    "group flex items-center justify-between px-6 py-4 rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest transition-all text-left border relative overflow-hidden",
                                    selectedCategory === cat 
                                        ? "bg-slate-900 border-slate-800 text-white shadow-xl translate-x-1" 
                                        : "bg-white border-transparent text-slate-400 hover:border-slate-100 hover:bg-slate-50/50 hover:text-slate-900"
                                )}
                            >
                                <span className="flex items-center gap-3 relative z-10">
                                    {cat === 'FAVORITES' ? <Star size={14} className="fill-amber-400 text-amber-400" /> : null}
                                    {cat === 'FAVORITES' ? 'Избранное' : translateCategory(cat)}
                                </span>
                                {selectedCategory === cat && <ChevronRight size={14} className="relative z-10 animate-pulse" />}
                                {selectedCategory === cat && <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile Categories (Touch-Optimized) */}
            <div className="lg:hidden -mx-3 px-3 overflow-x-auto no-scrollbar flex items-center gap-2 pb-2">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => onSelect(cat)}
                        className={cn(
                            "whitespace-nowrap px-5 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-tight transition-all border shrink-0 min-h-[44px]",
                            selectedCategory === cat ? "bg-slate-950 border-slate-950 text-white shadow-lg translate-y-0" : "bg-white border-slate-100 text-slate-400"
                        )}
                    >
                        {cat === 'FAVORITES' ? '★ ' : ''}{cat === 'FAVORITES' ? 'Избранное' : translateCategory(cat)}
                    </button>
                ))}
            </div>
        </>
    );
});

CategorySection.displayName = "CategorySection";

const ServiceCard = React.memo(({
    service,
    viewMode,
    isFavorite,
    isDisabled,
    onSelect,
    onInfo,
    onToggleFavorite
}: {
    service: SmmService;
    viewMode: 'grid' | 'list';
    isFavorite: boolean;
    isDisabled?: boolean;
    onSelect: () => void;
    onInfo: (e: React.MouseEvent) => void;
    onToggleFavorite: (e: React.MouseEvent) => void;
}) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onClick={isDisabled ? undefined : onSelect}
            role="button"
            className={cn(
                "transition-all duration-300 relative group overflow-hidden border p-4 rounded-[1.75rem] text-left cursor-pointer",
                "bg-slate-900/40 backdrop-blur-md border-white/5 shadow-2xl hover:bg-slate-800/60 hover:border-blue-500/30",
                service.isBest ? "border-amber-400/20 hover:border-amber-400/50 ring-1 ring-amber-400/10" : "border-white/5",
                viewMode === 'grid' ? "flex flex-col justify-between min-h-[120px]" : "flex flex-row items-center gap-4 py-3",
                isDisabled && "opacity-40 grayscale pointer-events-none"
            )}
        >
            <div className={cn("flex flex-col space-y-1 relative z-10", viewMode === 'list' && "flex-1 min-w-0")}>
                <div className="flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-1 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-white/5 rounded-md text-[7px] font-bold text-slate-500 uppercase tracking-widest">ID: {service.numericId || service.id.split('_').pop()}</span>
                        {service.isHot && <Flame size={10} className="text-rose-500 fill-rose-500/20" />}
                    </div>
                </div>
                <div className="font-bold text-slate-200 uppercase text-[10px] sm:text-xs leading-tight italic tracking-tight group-hover:text-blue-400 transition-colors line-clamp-2">
                    {service.name}
                </div>
            </div>
            
            <div className={cn("flex items-end justify-between relative z-10", viewMode === 'grid' ? "mt-2" : "gap-4")}>
                <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Цена за 1 шт.</span>
                    <span className="text-blue-400 font-black text-xs sm:text-sm">
                        {(service.pricePer1000 / 1000).toFixed(4).replace(/\.?0+$/, "")} ₽
                    </span>
                </div>
                <div className="flex items-center gap-1 pointer-events-auto">
                    <button onClick={onInfo} className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 transition-all">
                        <Info size={14} />
                    </button>
                    <button onClick={onToggleFavorite} className={cn("p-1.5 rounded-lg transition-all", isFavorite ? "text-rose-400 bg-rose-400/10" : "text-slate-600 hover:text-slate-400")}>
                        <Heart size={14} className={cn(isFavorite && "fill-current")} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
});

ServiceCard.displayName = "ServiceCard";

export const InstantOrder = ({ 
    initialLink = "", 
    initialServiceId = "", 
    initialPlatform = "", 
    isExpanded, 
    onExpandChange: setIsExpanded,
    globalStats
}: InstantOrderProps) => {
    const { data: session } = useSession();
    const [wizardStep, setWizardStep] = useState<'INPUT' | 'CONFIG' | 'SUMMARY'>('INPUT');
    const [link, setLink] = useState(initialLink);
    const [platform, setPlatform] = useState<string | null>(initialPlatform || null);
    const [detectedTargetType, setDetectedTargetType] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedService, setSelectedService] = useState<SmmService | null>(null);
    const [detailService, setDetailService] = useState<SmmService | null>(null);
    const [quantity, setQuantity] = useState<number>(0);
    const [email, setEmail] = useState('');
    const [consent, _setConsent] = useState(true);
    const [isValidationBypassed, setIsValidationBypassed] = useState(false);
    const [isManualMode, setIsManualMode] = useState(false);

    // Enhanced Service State
    const [allServices, setAllServices] = useState<SmmService[]>([]);
    const [isLoadingServices, setIsLoadingServices] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState("");
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

    // AI Analysis Simulation
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auth States for existing users
    const [authMode, setAuthMode] = useState<'PASSWORD' | 'MAGIC' | null>(null);
    const [password, setPassword] = useState('');
    const [magicCode, setMagicCode] = useState('');
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [isLinkInvalid, setIsLinkInvalid] = useState(false);

    // Advanced Options States
    const [showAdvanced, setShowAdvanced] = useState(true);
    const [isDripFeed, setIsDripFeed] = useState(false);
    const [runs, setRuns] = useState<number>(2);
    const [interval, setInterval] = useState<number>(30);
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduleTime, setScheduleTime] = useState<string>('');
    const [repeatInterval, setRepeatInterval] = useState<number | ''>('');
    const [showServiceInfo, setShowServiceInfo] = useState(false);
    // Initial setup from props
    useEffect(() => {
        if (initialLink) {
            setLink(initialLink);
            setIsExpanded(true);
        }
    }, [initialLink, setIsExpanded]);

    // Handle initialServiceId deep-linking
    useEffect(() => {
        if (initialServiceId && allServices.length > 0) {
            const service = allServices.find(s => s.id === initialServiceId);
            if (service) {
                setSelectedService(service);
                setPlatform(service.platform.toUpperCase());
                setSelectedCategory(service.category);
                setQuantity(service.minQty || 1);
            }
        }
    }, [initialServiceId, allServices]);

    // Restore Draft Order (Broken Loop protection)
    useEffect(() => {
        if (allServices.length > 0) {
            try {
                const draftRaw = localStorage.getItem('smmplan_draft_order');
                if (draftRaw) {
                    const draft = JSON.parse(draftRaw);
                    if (draft.expiresAt > Date.now() && draft.data) {
                        const { link: dLink, serviceId, quantity: dQty, isDripFeed: dDrip, runs: dRuns, interval: dInt } = draft.data;
                        const service = allServices.find(s => s.id === serviceId);
                        if (service) {
                            setLink(dLink || '');
                            setSelectedService(service);
                            setPlatform(service.platform.toUpperCase());
                            setSelectedCategory(service.category);
                            if (dQty) setQuantity(dQty);
                            if (dDrip !== undefined) setIsDripFeed(dDrip);
                            if (dRuns) setRuns(dRuns);
                            if (dInt) setInterval(dInt);
                            toast.success('Заказ восстановлен. Вы можете продолжить оформление!');
                            localStorage.removeItem('smmplan_draft_order');
                        }
                    } else {
                        localStorage.removeItem('smmplan_draft_order');
                    }
                }
            } catch (e) {
                console.error("Draft parsing failed", e);
            }
        }
    }, [allServices]);

    // Reset quantity when service changes
    useEffect(() => {
        if (selectedService) {
            setQuantity(selectedService.minQty || 1);
            setIsValidationBypassed(false);
        }
    }, [selectedService]);

    // Multiplicity Logic
    const isQtyMultiple = useMemo(() => {
        if (!selectedService || !selectedService.qtyStep || selectedService.qtyStep <= 1) return true;
        return (quantity % selectedService.qtyStep) === 0;
    }, [quantity, selectedService]);

    useEffect(() => {
        if (isExpanded) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');

            setIsLoadingServices(true);
            getInstantServices(undefined, platform).then(data => {
                setAllServices(data);
                setIsLoadingServices(false);
            });

            try {
                const saved = localStorage.getItem('smmplan_fav_services');
                if (saved) setFavoriteIds(JSON.parse(saved));
            } catch (e) { 
                console.error("Failed to load favorites", e);
            }
        } else {
            document.body.style.overflow = 'unset';
            document.body.classList.remove('modal-open');
        }
        return () => { 
            document.body.style.overflow = 'unset'; 
            document.body.classList.remove('modal-open');
        };
    }, [isExpanded, platform]);

    const handleEmailBlur = async () => {
        if (!email || email.length < 5 || !email.includes('@')) return;
        
        try {
            const res = await fetch('/api/client/auth/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (data.exists) {
                setAuthMode(prev => prev === 'MAGIC' ? 'MAGIC' : 'PASSWORD');
                setError(prev => prev ? prev : 'Этот аккаунт уже зарегистрирован. Введите пароль для входа.');
            }
        } catch (e) {
            console.warn('Email check failed', e);
        }
    };

    useEffect(() => {
        if (link.length > 5) {
            setIsAnalyzing(true);
            const timer = setTimeout(() => {
                setIsAnalyzing(false);
                const analysis = analyzeLink(link);
                
                if (analysis) {
                    setIsLinkInvalid(false);
                    if (analysis.platform.toUpperCase() === 'OTHER') {
                        setIsManualMode(true);
                        setPlatform(null);
                        setAnalysisResult(null);
                        setDetectedTargetType(null);
                    } else {
                        const detectedPlatform = analysis.platform.toUpperCase();
                        if (platform !== detectedPlatform) {
                            setPlatform(detectedPlatform);
                            setSelectedCategory(null);
                            setSelectedService(null);
                        }
                        
                        const tType = mapObjectTypeToTargetType(analysis.objectType);
                        setDetectedTargetType(tType);
                        
                        setAnalysisResult({
                            platform: analysis.platform,
                            objectType: analysis.objectType,
                            targetType: tType,
                            isPrivate: false,
                            isEmailRequired: !session
                        });
                    }
                } else if (!initialServiceId) {
                    setIsLinkInvalid(link.length > 5);
                    setPlatform(null);
                    setDetectedTargetType(null);
                    setAnalysisResult(null);
                    setSelectedCategory(null);
                    setSelectedService(null);
                }
                setIsValidationBypassed(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [link, session, initialServiceId]);

    const handleSendMagicCode = async () => {
        if (!email || isSendingCode) return;
        setIsSendingCode(true);
        setError(null);
        try {
            const res = await fetch('/api/client/auth/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (res.ok) {
                setAuthMode('MAGIC');
                toast.success('Код отправлен на почту!');
            } else {
                const data = await res.json();
                setError(data.error || 'Не удалось отправить код');
            }
        } catch (e) {
            setError('Ошибка сети при отправке кода');
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleAddToCart = () => {
        if (!selectedService || !link || !quantity) return;

        const cartItem = {
            id: Math.random().toString(36).substr(2, 9),
            serviceId: selectedService.id,
            platformLabel: platform || 'SOCIAL',
            strategyLabel: selectedService.name,
            price: formatCartTotalRaw(selectedService.pricePer1000, quantity),
            link: link,
            quantity: quantity,
            subs: quantity, // for display compatibility
            views: 0
        };

        const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
        localStorage.setItem('cart', JSON.stringify([...existingCart, cartItem]));
        
        // Notify other components
        window.dispatchEvent(new Event('cart-updated'));
        
        toast.success('Добавлено в корзину!', {
            icon: '🛒',
            style: {
                borderRadius: '1rem',
                background: '#0f172a',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
            }
        });
    };

    const handleOrder = async () => {
        if (!canSubmit || !selectedService) return;
        
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/client/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId: selectedService.id,
                    link,
                    quantity,
                    email: !session ? email : undefined,
                    password: authMode === 'PASSWORD' ? password : undefined,
                    magicCode: authMode === 'MAGIC' ? magicCode : undefined,
                    isDripFeed,
                    runs: isDripFeed ? runs : undefined,
                    interval: isDripFeed ? interval : undefined,
                    scheduleTime: isScheduled ? scheduleTime : undefined,
                    repeatInterval: (isScheduled && repeatInterval) ? repeatInterval : undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    setAuthMode('PASSWORD');
                    setError(data.message || 'Этот email уже зарегистрирован. Пожалуйста, введите пароль.');
                    return;
                }
                if (response.status === 401) {
                    setAuthMode(prev => prev || 'PASSWORD');
                    setError(data.message || data.error || 'Неверный пароль или код');
                    return;
                }
                throw new Error(data.message || data.error || 'Ошибка при создании заказа');
            }

            if (data.requiresPayment && data.paymentUrl) {
                // Smmplan Architecture: Broken Loop State Persistence
                localStorage.setItem('smmplan_draft_order', JSON.stringify({
                    expiresAt: Date.now() + 1000 * 60 * 60, // 1 hour TTL
                    data: { link, serviceId: selectedService.id, quantity, isDripFeed, runs, interval }
                }));

                // Seamless Auth for Guests (Zero-Friction Journey)
                if (data.loginToken) {
                    try {
                        await signIn('credentials', {
                            magicToken: data.loginToken,
                            redirect: false
                        });
                    } catch (authErr) {
                        console.warn('[Seamless Auth] Failed to login before redirect, proceeding as guest', authErr);
                    }
                }

                window.location.href = data.paymentUrl;
            } else {
                window.location.href = '/orders?payment=success';
            }
        } catch (error: any) {
            console.error('Order Error:', error);
            toast.error(error.message || 'Произошла ошибка при оформлении заказа. Попробуйте снова.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableCategories = useMemo(() => {
        const platformServices = platform 
            ? allServices.filter(s => s.platform.toUpperCase() === platform.toUpperCase())
            : allServices;
        
        const filteredByTarget = detectedTargetType 
            ? platformServices.filter(s => !s.targetType || s.targetType === 'ALL' || s.targetType === detectedTargetType)
            : platformServices;

        const cats = new Set(filteredByTarget.map(s => s.category));
        const uniqueCats = Array.from(cats);
        if (favoriteIds.length > 0) return ['FAVORITES', ...uniqueCats];
        return uniqueCats;
    }, [allServices, favoriteIds, platform, detectedTargetType]);

    const filteredServices = useMemo(() => {
        return allServices.filter(s => {
            const isFavTab = selectedCategory === 'FAVORITES';
            const matchesPlatform = !platform || s.platform.toUpperCase() === platform.toUpperCase();
            
            // Allow all favorites to be shown, even if they don't match platform
            if (!isFavTab && !matchesPlatform) return false;

            if (!isFavTab && detectedTargetType && s.targetType && s.targetType !== 'ALL') {
                if (detectedTargetType === 'POST') {
                    if (s.targetType !== 'POST' && s.targetType !== 'CHANNEL') return false;
                } else if (s.targetType !== detectedTargetType) {
                    return false;
                }
            }

            const matchesCategory = isFavTab ? favoriteIds.includes(s.id) : (!selectedCategory || s.category === selectedCategory);
            const matchesSearch = !searchQuery || 
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (s.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.numericId || "").toString().includes(searchQuery);
            return matchesCategory && matchesSearch;
        });
    }, [allServices, selectedCategory, searchQuery, favoriteIds, platform, detectedTargetType]);

    const toggleFavorite = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = favoriteIds.includes(id) 
            ? favoriteIds.filter(fid => fid !== id) 
            : [...favoriteIds, id];
        setFavoriteIds(next);
        localStorage.setItem('smmplan_fav_services', JSON.stringify(next));
    };

    // Validation
    const isLinkValid = link.length > 5;
    const isQuantityValid = selectedService && quantity >= (selectedService.minQty || 1);
    const isEmailValid = email.includes('@') && email.includes('.');
    const isAuthValid = session || isEmailValid;
    
    // Check if auth fields are filled when required
    const isAuthParamsValid = !authMode || 
        (authMode === 'PASSWORD' && password.length >= 3) || 
        (authMode === 'MAGIC' && magicCode.length >= 5);
        
    const isStepValid = isQtyMultiple;
    
    const validationError = useMemo(() => {
        if (!selectedService || !analysisResult || isValidationBypassed || isManualMode) return null;
        const serviceType = selectedService.targetType || 'POST';
        const linkType = analysisResult.targetType || 'POST';
        if (serviceType === linkType) return null;
        if (serviceType === 'CHANNEL' && linkType === 'POST') return null;
        return `Внимание: Вы выбрали услугу типа "${serviceType}", но ссылка ведет на "${linkType}". Это может привести к отмене заказа.`;
    }, [selectedService, analysisResult, isValidationBypassed, isManualMode]);
    const canSubmit = isLinkValid && isQuantityValid && isStepValid && isAuthValid && isAuthParamsValid && (!validationError || isValidationBypassed);

    // Auto-select first category
    useEffect(() => {
        if (availableCategories.length > 0 && !selectedCategory) {
            setSelectedCategory(availableCategories[0]);
        }
    }, [availableCategories, selectedCategory]);

    // Auto-select first service to reduce friction (Zero-Click Ordering) ONLY on new platforms
    const lastAutoSelectedPlatformRef = useRef<string | null>(null);
    useEffect(() => {
        if (platform && platform !== lastAutoSelectedPlatformRef.current && filteredServices.length > 0) {
            setSelectedService(filteredServices[0]);
            lastAutoSelectedPlatformRef.current = platform;
        }
    }, [filteredServices, platform]);

    const activeBrandColor = 
        platform === 'TELEGRAM' ? '#0088CC' : 
        platform === 'INSTAGRAM' ? '#E1306C' : 
        platform === 'VK' ? '#0077FF' : 
        platform === 'YOUTUBE' ? '#FF0000' :
        platform === 'TIKTOK' ? '#ff0050' :
        platform === 'TWITTER' ? '#1DA1F2' :
        platform === 'FACEBOOK' ? '#1877F2' :
        '#3b82f6';

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col min-h-0 relative z-[100]">
            <AnimatePresence>
                {isExpanded && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsExpanded(false)}
                            className="fixed inset-0 bg-slate-950/80 backdrop-blur-3xl z-[9000]"
                        />

                        <motion.div
                            variants={scaleIn}
                            initial="hidden"
                            animate="show"
                            exit="hidden"
                            className="fixed inset-0 z-[9999] bg-slate-50 flex flex-col"
                        >
                            {/* Premium Site-Synced Header */}
                            <div className="w-full bg-white/70 backdrop-blur-xl border-b border-slate-100 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-[10010] min-h-[72px]">
                                <div className="flex items-center gap-6">
                                    <Link href="/" className="flex items-center gap-2 group pointer-events-auto" onClick={() => setIsExpanded(false)}>
                                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-blue-500/20">
                                            <Rocket className="text-white w-5 h-5" />
                                        </div>
                                        <div className="hidden sm:flex flex-col">
                                            <span className="text-lg font-black tracking-tighter text-slate-900 leading-none">
                                                Smmplan
                                            </span>
                                            <span className="text-[7px] font-bold text-blue-600 uppercase tracking-[0.3em] mt-0.5">Premium SMM</span>
                                        </div>
                                    </Link>

                                    <div className="h-8 w-px bg-slate-100 hidden md:block" />

                                    {/* trust indicators infusion */}
                                    <div className="hidden lg:flex items-center gap-6">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1">
                                                <Star size={12} className="text-amber-400 fill-amber-400" />
                                                <span className="text-[11px] font-black text-slate-900">4.9/5</span>
                                            </div>
                                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none">Rating</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-slate-900">{globalStats?.formatted?.users || '45,000+'}</span>
                                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none">Brands</span>
                                        </div>
                                    </div>
                                    
                                    {/* AI Status Badge */}
                                    <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/5 rounded-full border border-blue-500/10 scale-90 md:scale-100">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600/80">
                                            Cognitive AI v5.0
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 md:gap-4">
                                    <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                                        <ShieldCheck size={14} className="text-emerald-500" />
                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Safe Order</span>
                                    </div>
                                    <button 
                                        onClick={() => setIsExpanded(false)}
                                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all active:scale-90 border border-slate-100 text-slate-500 group pointer-events-auto"
                                    >
                                        <X size={20} className="group-hover:rotate-90 transition-transform" />
                                    </button>
                                </div>
                            </div>

                            <div 
                                className="overflow-hidden flex flex-col w-full h-full border-t-4"
                                style={{ borderTopColor: platform ? activeBrandColor : '#3b82f6' }}
                            >
                                <motion.div 
                                    variants={staggerContainer}
                                    initial="hidden"
                                    animate="show"
                                    className="p-3 md:p-6 space-y-4 md:space-y-5 overflow-y-auto w-full max-w-2xl mx-auto h-full no-scrollbar pb-32"
                                >
                                    {/* Action Header for Context */}
                                    {!selectedService ? (
                                        <motion.div variants={fadeInUp} className="space-y-6 mb-4">
                                            {/* Trust Ribbon Infusion */}
                                            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 bg-blue-600/5 border border-blue-600/10 rounded-3xl px-6 py-4 max-w-3xl mx-auto backdrop-blur-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex -space-x-2">
                                                        {[1, 2, 3].map((i) => (
                                                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                                                                <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="User" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-900 uppercase">45k+ Доверяют нам</span>
                                                </div>
                                                <div className="h-4 w-px bg-slate-200 hidden md:block" />
                                                <div className="flex items-center gap-2">
                                                    <StarIcon size={14} className="text-amber-400 fill-amber-400" />
                                                    <span className="text-[10px] font-black text-slate-900">Высочайшее качество (4.9/5)</span>
                                                </div>
                                                <div className="h-4 w-px bg-slate-200 hidden md:block" />
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck size={14} className="text-blue-500" />
                                                    <span className="text-[10px] font-black text-slate-900">Защита 24/7</span>
                                                </div>
                                            </div>

                                            <div className="text-center max-w-2xl mx-auto space-y-2">
                                                <h3 className="text-2xl md:text-3xl font-black text-slate-950 uppercase italic leading-tight tracking-tighter">
                                                    Умный <span className="text-blue-600">Заказ</span>
                                                </h3>
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className="h-px w-8 bg-slate-200" />
                                                    <span className="text-[10px] text-blue-600 font-black uppercase tracking-[0.3em]">Интеллектуальный AI-парсинг</span>
                                                    <div className="h-px w-8 bg-slate-200" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div variants={fadeInUp} className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 rounded-2xl p-5 text-white shadow-xl shadow-blue-900/10 mb-4 relative overflow-hidden group border border-white/5">
                                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-all duration-700 -translate-y-2 translate-x-2 pointer-events-none">
                                                {platform && <BrandIcon name={platform.toLowerCase()} size={80} colorMode="white" />}
                                            </div>
                                            <div className="relative z-10 flex items-center justify-between gap-4">
                                                <div className="space-y-1 min-w-0 flex-1">
                                                    <span className="text-blue-400 text-[7px] font-black uppercase tracking-[0.3em]">Активная услуга</span>
                                                    <h2 className="text-lg md:text-xl font-black tracking-tight leading-tight line-clamp-2">
                                                        {cleanServiceName(selectedService.name)}
                                                    </h2>
                                                    <div className="flex items-center gap-3 pt-1">
                                                        <span className="text-blue-400 font-black text-sm">{formatUnitPrice(selectedService.pricePer1000)} ₽<span className="text-[7px] text-blue-400/60 font-bold ml-1">/ шт</span></span>
                                                        <span className="text-[7px] text-slate-500">•</span>
                                                        <span className="text-[8px] text-slate-400 font-bold">от {selectedService.minQty} шт</span>
                                                    </div>
                                                </div>
                                                
                                                    <div className="flex items-center gap-2 shrink-0">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setShowServiceInfo(!showServiceInfo)}
                                                        className={cn("w-9 h-9 rounded-xl border flex items-center justify-center transition-all relative z-20", showServiceInfo ? "bg-white/15 border-white/30" : "bg-white/5 hover:bg-white/10 border-white/10")}
                                                        title="Характеристики услуги"
                                                    >
                                                        <Info size={14} className="text-white/60" />
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => { setSelectedService(null); setShowServiceInfo(false); setWizardStep('INPUT'); }}
                                                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[8px] font-black uppercase tracking-widest transition-all relative z-20"
                                                    >
                                                        Изменить
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Inline Service Info Panel */}
                                            <AnimatePresence>
                                                {showServiceInfo && selectedService && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                                                            {selectedService.description && (
                                                                <p className="text-[10px] text-slate-300 leading-relaxed">{selectedService.description}</p>
                                                            )}
                                                            {selectedService.requirements && (
                                                                <p className="text-[9px] text-amber-400/80 flex items-start gap-1.5">
                                                                    <AlertTriangle size={10} className="shrink-0 mt-0.5" />
                                                                    {selectedService.requirements}
                                                                </p>
                                                            )}
                                                            <div className="flex flex-wrap gap-2 text-[8px] text-slate-400">
                                                                <span>Мин: {selectedService.minQty} шт</span>
                                                                {selectedService.maxQty && <span>• Макс: {selectedService.maxQty} шт</span>}
                                                                {selectedService.qtyStep && <span>• Шаг: ±{selectedService.qtyStep}</span>}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    )}

                                    {/* SERVICE INFO & QUICK STATS: Digital Obsidian Style */}
                                    <AnimatePresence>
                                        {selectedService && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex flex-wrap gap-1.5 mb-3"
                                            >
                                                {(() => {
                                                    const meta = parseServiceMeta(selectedService);
                                                    return (<>
                                                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wide border",
                                                            meta.guaranteeColor === 'rose' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        )}>
                                                            <ShieldCheck size={10} />
                                                            {meta.guarantee}
                                                        </span>
                                                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wide border",
                                                            meta.qualityColor === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                                        )}>
                                                            <Zap size={10} />
                                                            {meta.quality}
                                                        </span>
                                                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wide border",
                                                            meta.dropoffColor === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        )}>
                                                            <RotateCcw size={10} />
                                                            Списания: {meta.dropoff}
                                                        </span>
                                                    </>);
                                                })()}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <div className="space-y-3">
                                        {/* Row 1: Link & Quantity */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                            {/* Link Input */}
                                            <div className={cn("relative group transition-all", selectedService ? "md:col-span-8" : "md:col-span-12")}>
                                                <div className="absolute inset-0 bg-blue-600/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                                <div className="relative h-16 md:h-14 bg-blue-50/40 border-2 border-slate-300 rounded-2xl px-4 flex items-center group-focus-within:border-blue-500 group-focus-within:ring-4 group-focus-within:ring-blue-100 transition-all shadow-sm">
                                                    {analysisResult && platform ? (
                                                        <div className="mr-3 shrink-0"><BrandIcon name={platform.toLowerCase()} size={18} /></div>
                                                    ) : (
                                                        <Link2 className="text-slate-400 mr-3 shrink-0" size={18} />
                                                    )}
                                                    <div className="flex flex-col flex-1 mt-0.5">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{(() => {
                                                            const svcPlatform = selectedService?.platform;
                                                            const pName = svcPlatform ? (PLATFORMS[svcPlatform as keyof typeof PLATFORMS] || svcPlatform) : (platform ? (PLATFORMS[platform as keyof typeof PLATFORMS] || platform) : null);
                                                            const rawType = selectedService?.targetType;
                                                            const tType = (rawType && rawType !== 'ALL') ? translateTargetType(rawType) : null;
                                                            if (tType && pName) return `Ссылка на ${tType} ${pName}`;
                                                            if (tType) return `Ссылка на ${tType}`;
                                                            if (pName) return `Ссылка на ${pName}`;
                                                            return 'Вставьте ссылку';
                                                        })()}</span>
                                                        <input 
                                                            value={link}
                                                            onChange={(e) => setLink(e.target.value)}
                                                            placeholder="https://t.me/example"
                                                            className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-slate-950 font-black text-sm md:text-xs p-0 h-5 md:h-4 placeholder:text-slate-300"
                                                        />
                                                    </div>
                                                    {isAnalyzing && <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full ml-2" />}
                                                </div>
                                            </div>

                                            {/* Quantity Control (4/12) */}
                                            <AnimatePresence>
                                            {selectedService && (
                                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="md:col-span-4 space-y-1.5">
                                                    <div className="h-14 bg-slate-100/50 border border-slate-200 rounded-2xl p-1 flex items-stretch">
                                                    <button 
                                                        onClick={() => setQuantity(Math.max(selectedService?.minQty || 1, quantity - (selectedService?.qtyStep || 10)))} 
                                                        className="w-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-950 transition-all shadow-sm"
                                                    >
                                                        <ChevronLeft size={18}/>
                                                    </button>
                                                    <div className="flex-1 flex flex-col justify-center items-center">
                                                        <input 
                                                            type="number" 
                                                            value={quantity} 
                                                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} 
                                                            className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-slate-950 text-center font-black text-base p-0 w-full leading-none" 
                                                        />
                                                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">Количество</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => setQuantity(quantity + (selectedService?.qtyStep || 10))} 
                                                        className="w-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-950 transition-all shadow-sm"
                                                    >
                                                        <ChevronRight size={18}/>
                                                    </button>
                                                </div>
                                                {/* Smart Quantity Presets */}
                                                {selectedService && (() => {
                                                    const min = selectedService.minQty || 1;
                                                    const max = selectedService.maxQty;
                                                    const step = selectedService.qtyStep || 10;
                                                    const standards = [100, 500, 1000, 5000, 10000];
                                                    let presets = standards.filter(v => v >= min && (!max || v <= max));
                                                    // Add minQty as first preset if it's not already a standard value
                                                    if (min > 1 && !standards.includes(min)) presets = [min, ...presets];
                                                    presets = presets.slice(0, 5);
                                                    return presets.length > 0 ? (
                                                        <div className="flex gap-1">
                                                            {presets.map((preset) => (
                                                                <button
                                                                    key={preset}
                                                                    onClick={() => setQuantity(preset)}
                                                                    className={cn(
                                                                        "flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all border",
                                                                        quantity === preset 
                                                                            ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                                                                            : "bg-white text-slate-500 border-slate-200 hover:border-blue-200 hover:text-blue-600"
                                                                    )}
                                                                >
                                                                    {preset >= 1000 ? `${preset / 1000}K` : preset}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ) : null;
                                                        })()}
                                                </motion.div>
                                            )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Catalog Injection when !selectedService */}
                                        <AnimatePresence>
                                            {!selectedService && platform && filteredServices.length > 0 && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="mt-6 space-y-4"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-px w-full bg-slate-100" />
                                                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 whitespace-nowrap">Или выберите другую услугу вручную</span>
                                                        <div className="h-px w-full bg-slate-100" />
                                                    </div>
                                                    
                                                    {availableCategories.length > 1 && (
                                                        <CategorySection 
                                                            categories={availableCategories} 
                                                            selectedCategory={selectedCategory} 
                                                            onSelect={(cat) => setSelectedCategory(cat)} 
                                                        />
                                                    )}

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 pb-4 snap-y custom-scrollbar">
                                                        <AnimatePresence mode="popLayout">
                                                            {filteredServices.map((service) => (
                                                                <ServiceCard
                                                                    key={service.id}
                                                                    service={service}
                                                                    viewMode="grid"
                                                                    isFavorite={favoriteIds.includes(service.id)}
                                                                    onSelect={() => {
                                                                        setSelectedService(service);
                                                                    }}
                                                                    onInfo={(e) => {
                                                                        e.stopPropagation();
                                                                        setDetailService(service);
                                                                    }}
                                                                    onToggleFavorite={(e) => toggleFavorite(service.id, e)}
                                                                />
                                                            ))}
                                                        </AnimatePresence>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Row 2: Email & Actions and Advanced Settings */}
                                        <AnimatePresence>
                                        {selectedService && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3 mt-3">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                                            {/* Email/Auth Sector (5/12) */}
                                            <div className="md:col-span-6 flex flex-col gap-2">
                                                {!session ? (
                                                    <motion.div className={cn("relative group bg-blue-50/40 border-2 rounded-2xl flex flex-col overflow-hidden transition-all", authMode ? "border-blue-500 ring-4 ring-blue-100 shadow-sm" : "border-slate-300 shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100")}>
                                                        {/* Email Input */}
                                                        <div className="relative h-16 px-4 flex items-center bg-transparent z-10">
                                                            <Mail className={cn("mr-3 shrink-0 transition-colors", authMode ? "text-blue-500" : "text-slate-400")} size={18} />
                                                            <div className="flex-1 flex flex-col mt-0.5">
                                                                <span className={cn("text-[8px] font-black uppercase tracking-widest leading-none mb-1 transition-colors", authMode ? "text-blue-500" : "text-slate-400")}>Ваш Email для чека</span>
                                                                <input 
                                                                    type="email"
                                                                    name="email"
                                                                    id="order-email"
                                                                    value={email}
                                                                    onBlur={handleEmailBlur}
                                                                    onChange={(e) => setEmail(e.target.value)}
                                                                    placeholder="mail@example.com"
                                                                    autoComplete="email"
                                                                    className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-slate-950 font-black text-sm p-0 h-5 placeholder:text-slate-300"
                                                                />
                                                            </div>
                                                            {authMode && (
                                                                <span className="text-[7px] font-black text-amber-600 bg-amber-50 px-1.5 py-1 rounded-md uppercase tracking-widest ml-2 border border-amber-100/50">
                                                                    Требуется {authMode === 'PASSWORD' ? 'Пароль' : 'Код'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Auth Inline Popover (Seamless Accordion) */}
                                                        <AnimatePresence>
                                                            {authMode && (
                                                                <motion.div 
                                                                    initial={{ height: 0, opacity: 0 }} 
                                                                    animate={{ height: 'auto', opacity: 1 }} 
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="border-t border-slate-200/50 bg-white"
                                                                >
                                                                    <div className="p-3 pl-4 flex items-center gap-3">
                                                                        <Key className="text-blue-600 shrink-0" size={16} />
                                                                        <div className="flex-1 flex flex-col mt-0.5 relative">
                                                                            <div className="flex items-center justify-between mb-1">
                                                                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                                                    {authMode === 'PASSWORD' ? "Введите пароль" : "Код из почты"}
                                                                                </span>
                                                                                {authMode === 'PASSWORD' && (
                                                                                    <button 
                                                                                        type="button"
                                                                                        onClick={handleSendMagicCode}
                                                                                        disabled={isSendingCode}
                                                                                        className="text-[7px] font-black text-blue-600 hover:text-blue-500 uppercase tracking-widest leading-none"
                                                                                    >
                                                                                        {isSendingCode ? 'Отправляем...' : 'Забыли пароль?'}
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                            <input 
                                                                                type={authMode === 'PASSWORD' ? 'password' : 'text'}
                                                                                name={authMode === 'PASSWORD' ? 'password' : 'code'}
                                                                                id={authMode === 'PASSWORD' ? 'order-password' : 'order-code'}
                                                                                value={authMode === 'PASSWORD' ? password : magicCode}
                                                                                autoFocus
                                                                                onChange={(e) => {
                                                                                    if (error) setError(null);
                                                                                    if (authMode === 'PASSWORD') {
                                                                                        setPassword(e.target.value);
                                                                                    } else {
                                                                                        setMagicCode(e.target.value);
                                                                                    }
                                                                                }}
                                                                                placeholder="••••••••"
                                                                                className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-slate-950 text-sm font-black p-0 h-5"
                                                                            />
                                                                        </div>
                                                                        {authMode === 'MAGIC' && !magicCode && (
                                                                            <button 
                                                                                type="button"
                                                                                onClick={handleSendMagicCode}
                                                                                disabled={isSendingCode}
                                                                                className="h-8 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-slate-900/20"
                                                                            >
                                                                                {isSendingCode ? '...' : 'Выслать'}
                                                                            </button>
                                                                        )}
                                                                        <button type="button" onClick={() => setAuthMode(null)} className="h-8 w-8 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-1 shrink-0">
                                                                            <X size={14} />
                                                                        </button>
                                                                    </div>
                                                                    
                                                                    {/* Inline Auth Error */}
                                                                    {error && !validationError && (
                                                                        <div className="px-4 pb-3 pt-1">
                                                                            <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tight leading-tight italic">
                                                                                {error}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </motion.div>
                                                ) : (
                                                    <div className="h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center px-4">
                                                        <User size={18} className="text-blue-600 mr-3 shrink-0" />
                                                        <div className="flex flex-col mt-0.5 min-w-0">
                                                            <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Личный кабинет</span>
                                                            <span className="text-sm font-black text-slate-950 truncate">{session.user?.email}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* ACTION: Split Price/Pay Button & Cart (7/12) */}
                                            <div className="md:col-span-6 flex items-stretch gap-2 h-16">
                                                <div className="flex-1 bg-blue-600 rounded-2xl p-1 flex items-stretch shadow-xl shadow-blue-600/20 group">
                                                    {/* Price Part */}
                                                    <div className="flex-[0.4] bg-white/10 rounded-xl flex flex-col justify-center items-center px-2 sm:px-4">
                                                        <span className="text-[7px] font-black text-blue-100 uppercase tracking-widest leading-none mb-1 opacity-70">Итоговая стоимость</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-lg sm:text-xl font-black text-white leading-none">{selectedService ? formatCartTotal(selectedService.pricePer1000, quantity) : '0,00'}</span>
                                                            <span className="text-[10px] font-black text-blue-200 uppercase italic leading-none">₽</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Action Part */}
                                                    <button 
                                                        onClick={handleOrder}
                                                        disabled={!canSubmit || isSubmitting}
                                                        className={cn(
                                                            "flex-[0.6] flex items-center justify-center gap-2 sm:gap-3 text-white font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all",
                                                            (!canSubmit || isSubmitting) ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02] active:scale-95"
                                                        )}
                                                    >
                                                        {isSubmitting ? (
                                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        ) : (
                                                            <>
                                                                Оплатить заказ
                                                                <Zap size={14} className="fill-white shrink-0" />
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Cart Button */}
                                                <button 
                                                    onClick={handleAddToCart} 
                                                    disabled={!canSubmit} 
                                                    className={cn(
                                                        "w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center transition-all border",
                                                        canSubmit 
                                                            ? "bg-slate-100 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" 
                                                            : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                                                    )}
                                                >
                                                    <ShoppingBag size={20}/>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Trust Micro-Strip */}
                                        <div className="flex items-center justify-center gap-3 py-1">
                                            <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500" /> Безопасная оплата</span>
                                            <span className="text-slate-200">•</span>
                                            <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1"><Zap size={10} className="text-blue-500" /> Мгновенный старт</span>
                                            <span className="text-slate-200">•</span>
                                            <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1"><ShieldCheck size={10} className="text-emerald-500" /> Гарантия</span>
                                        </div>
                                        {/* Advanced Settings Toggle */}
                                        <div className="pt-3">
                                            <button 
                                                onClick={() => setShowAdvanced(!showAdvanced)}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 hover:text-blue-600 hover:border-blue-200 transition-all w-full justify-center"
                                            >
                                                <div className={cn("transition-transform", showAdvanced && "rotate-180")}>
                                                    <ChevronDown size={14} />
                                                </div>
                                                Продвинутые настройки
                                            </button>
                                        </div>

                                        {/* Advanced Settings Panel: Light Theme */}
                                        <AnimatePresence>
                                            {showAdvanced && (
                                                <motion.div 
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl mt-3">
                                                        {/* Drip-Feed Section */}
                                                        <div className="space-y-3">
                                                            <button 
                                                                onClick={() => setIsDripFeed(!isDripFeed)}
                                                                className={cn(
                                                                    "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
                                                                    isDripFeed ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white border-slate-200"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isDripFeed ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400")}>
                                                                        <Layers size={14} />
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <span className={cn("text-[10px] font-black uppercase block leading-none", isDripFeed ? "text-blue-700" : "text-slate-900")}>Drip-Feed</span>
                                                                        <span className={cn("text-[7px] font-bold uppercase tracking-widest leading-none mt-1", isDripFeed ? "text-blue-500" : "text-slate-400")}>Растянуть выполнение</span>
                                                                    </div>
                                                                </div>
                                                                <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", isDripFeed ? "border-blue-600 bg-blue-600" : "border-slate-200")}>
                                                                    {isDripFeed && <CheckCircle2 size={10} className="text-white font-bold" />}
                                                                </div>
                                                            </button>

                                                            {isDripFeed && (
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                                                                        <span className="text-[7px] font-black text-slate-400 uppercase block mb-1">Запусков (Runs)</span>
                                                                        <input 
                                                                            type="number" 
                                                                            value={runs} 
                                                                            onChange={(e) => setRuns(parseInt(e.target.value) || 2)}
                                                                            className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-slate-950 font-black text-sm p-0"
                                                                        />
                                                                    </div>
                                                                    <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                                                                        <span className="text-[7px] font-black text-slate-400 uppercase block mb-1">Интервал (мин)</span>
                                                                        <input 
                                                                            type="number" 
                                                                            value={interval} 
                                                                            onChange={(e) => setInterval(parseInt(e.target.value) || 30)}
                                                                            className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-slate-950 font-black text-sm p-0"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Schedule Section */}
                                                        <div className="space-y-3">
                                                            <button 
                                                                onClick={() => setIsScheduled(!isScheduled)}
                                                                className={cn(
                                                                    "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
                                                                    isScheduled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white border-slate-200"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isScheduled ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                                                                        <Calendar size={14} />
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <span className={cn("text-[10px] font-black uppercase block leading-none", isScheduled ? "text-emerald-700" : "text-slate-900")}>Планировщик</span>
                                                                        <span className={cn("text-[7px] font-bold uppercase tracking-widest leading-none mt-1", isScheduled ? "text-emerald-500" : "text-slate-400")}>Отложенный старт</span>
                                                                    </div>
                                                                </div>
                                                                <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", isScheduled ? "border-emerald-600 bg-emerald-600" : "border-slate-200")}>
                                                                    {isScheduled && <CheckCircle2 size={10} className="text-white font-bold" />}
                                                                </div>
                                                            </button>

                                                            {isScheduled && (
                                                                <div className="grid grid-cols-1 gap-2">
                                                                    <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                                                                        <span className="text-[7px] font-black text-slate-400 uppercase block mb-1">Дата и время запуска</span>
                                                                        <input 
                                                                            type="datetime-local" 
                                                                            value={scheduleTime} 
                                                                            onChange={(e) => setScheduleTime(e.target.value)}
                                                                            className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-slate-950 font-black text-xs p-0"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        </motion.div>
                                        )}
                                        </AnimatePresence>
                                        <AnimatePresence>
                                            {validationError && (
                                                <motion.div 
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="relative overflow-hidden mt-4"
                                                >
                                                    <div className="px-5 py-4 rounded-2xl border bg-amber-50 border-amber-200">
                                                        <div className="flex items-start gap-4">
                                                            <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                                                            <div className="flex flex-col gap-3">
                                                                <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight italic text-amber-700 leading-snug">
                                                                    {validationError}
                                                                </span>
                                                                <label className="flex items-center gap-2 cursor-pointer group w-fit">
                                                                    <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors", isValidationBypassed ? "bg-amber-500 border-amber-500" : "bg-white border-amber-200 group-hover:border-amber-400")}>
                                                                        {isValidationBypassed && <Check size={14} className="text-white font-bold" />}
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest leading-none select-none">
                                                                        Осознаю риски, продолжить заказ
                                                                    </span>
                                                                    <input type="checkbox" className="hidden" checked={isValidationBypassed} onChange={(e) => setIsValidationBypassed(e.target.checked)} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Footer Trust Bar: Simplified */}
                                <div className="border-t border-slate-100 bg-white/50 backdrop-blur-md py-3 px-6 mt-auto">
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[8px] font-bold text-slate-400">Карта / СБП / Крипто</span>
                                        </div>
                                        <span className="text-slate-200">•</span>
                                        <span className="text-[8px] font-bold text-slate-400">Гарантия возврата</span>
                                        <span className="text-slate-200">•</span>
                                        <Link href="/terms" className="text-[8px] font-bold text-slate-300 hover:text-blue-500 transition-colors">Оферта</Link>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Service Details Overlay: Light Theme Refined */}
                <AnimatePresence>
                    {detailService && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm"
                            onClick={() => setDetailService(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100"
                            >
                                <div className="px-8 py-7 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 scale-150">
                                        <Info size={100} />
                                    </div>
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
                                            <Info size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-100 italic">Характеристики</h4>
                                            <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-0.5">ID: {detailService.numericId || detailService.id}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setDetailService(null)}
                                        className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all group relative z-10"
                                    >
                                        <X size={20} className="group-hover:rotate-90 transition-transform text-white/80" />
                                    </button>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 uppercase italic leading-tight mb-4 tracking-tighter">{detailService.name}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase">{translatePlatform(detailService.platform)}</span>
                                            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase">{translateCategory(detailService.category)}</span>
                                        </div>
                                    </div>

                                    {detailService.requirements && (
                                        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                                            <div className="flex items-center gap-2 mb-2 text-amber-700">
                                                <AlertTriangle size={14} />
                                                <span className="text-[9px] font-black uppercase tracking-wider">Важно</span>
                                            </div>
                                            <p className="text-xs font-bold text-amber-950 leading-relaxed uppercase italic">{detailService.requirements}</p>
                                        </div>
                                    )}

                                    {detailService.description && (
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Описание</span>
                                            <p className="text-sm text-slate-600 leading-relaxed font-medium italic whitespace-pre-wrap">{detailService.description}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-slate-50">
                                        <div className="bg-slate-50 p-4 rounded-2xl">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Объем</span>
                                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight italic">{detailService.minQty} - {detailService.maxQty || '∞'}</p>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-2xl text-right">
                                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider block mb-1">Цена</span>
                                            <p className="text-lg font-black text-blue-600 italic">{formatUnitPrice(detailService.pricePer1000)}₽ <span className="text-[8px] uppercase text-blue-400 not-italic">/ шт</span></p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { setSelectedService(detailService); setDetailService(null); }}
                                        className="w-full h-16 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] italic hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98]"
                                    >
                                        Выбрать эту услугу
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
    );
};

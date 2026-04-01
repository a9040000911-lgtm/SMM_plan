import { useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { getInstantServices } from '@/app/_actions/services/getInstantServices';
import { SmmService, ServiceFilter } from './types';

export function useServiceFiltering(
    session: any,
    initialServiceId: string | undefined,
    state: any,
    analysisResult: any,
    platform: string | null,
    link: string,
    isManualMode: boolean,
    selectedCategory: string | null,
    searchQuery: string,
    favoriteIds: string[],
    activeFilters: ServiceFilter[]
) {
    const {
        setAllServices, setIsLoadingServices, allServices, setSelectedService,
        setSelectedCategory, setPlatform, setQuantity, setIsDripFeed, setRuns,
        setIntervalValue, setLink, setIsValidationBypassed, setPollOption,
        setFavoriteIds, setActiveFilters, selectedService
    } = state;

    // === LOAD SERVICES ===
    const loadServices = useCallback(async () => {
        setIsLoadingServices(true);
        try {
            const data = await getInstantServices(undefined, platform);
            setAllServices(data);
        } finally {
            setIsLoadingServices(false);
        }
    }, [platform, setIsLoadingServices, setAllServices]);

    useEffect(() => {
        loadServices();
    }, [loadServices]);

    // Reset Drip-Feed if service disables it
    useEffect(() => {
        if (selectedService?.isDripFeedDisabled) {
            setIsDripFeed(false);
        }
    }, [selectedService, setIsDripFeed]);

    // Load favorites
    useEffect(() => {
        try {
            if (session) {
                fetch('/api/client/favorites')
                    .then(res => res.json())
                    .then(data => {
                        if (data.success && Array.isArray(data.data)) {
                            setFavoriteIds(data.data);
                        }
                    })
                    .catch(console.error);
            } else {
                const saved = localStorage.getItem('smmplan_fav_services');
                if (saved) setFavoriteIds(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load favorites', e);
        }
    }, [session, setFavoriteIds]);

    // Handle initialServiceId
    useEffect(() => {
        if (initialServiceId && allServices.length > 0) {
            const service = allServices.find((s: SmmService) => s.id === initialServiceId);
            if (service) {
                setSelectedService(service);
                setPlatform(service.platform.toUpperCase());
                setSelectedCategory(service.category);
                setQuantity(service.minQty || 1);
            }
        }
    }, [initialServiceId, allServices, setSelectedService, setPlatform, setSelectedCategory, setQuantity]);

    // Restore draft order
    useEffect(() => {
        if (allServices.length > 0) {
            try {
                const draftRaw = localStorage.getItem('smmplan_draft_order');
                if (draftRaw) {
                    const draft = JSON.parse(draftRaw);
                    if (draft.expiresAt > Date.now() && draft.data) {
                        const { link: dLink, serviceId, quantity: dQty, isDripFeed: dDrip, runs: dRuns, interval: dInt } = draft.data;
                        const service = allServices.find((s: SmmService) => s.id === serviceId);
                        if (service) {
                            setLink(dLink || '');
                            setSelectedService(service);
                            setPlatform(service.platform.toUpperCase());
                            setSelectedCategory(service.category);
                            if (dQty) setQuantity(dQty);
                            if (dDrip !== undefined) setIsDripFeed(dDrip);
                            if (dRuns) setRuns(dRuns);
                            if (dInt) setIntervalValue(dInt);
                            toast.success('Заказ восстановлен. Вы можете продолжить оформление!');
                            localStorage.removeItem('smmplan_draft_order');
                        }
                    } else {
                        localStorage.removeItem('smmplan_draft_order');
                    }
                }
            } catch (e) {
                console.error('Draft parsing failed', e);
            }
        }
    }, [allServices, setLink, setSelectedService, setPlatform, setSelectedCategory, setQuantity, setIsDripFeed, setRuns, setIntervalValue]);

    // Reset quantity when service changes
    useEffect(() => {
        if (selectedService) {
            setQuantity(selectedService.minQty || 1);
            setIsValidationBypassed(false);
            setPollOption(null);
        }
    }, [selectedService, setQuantity, setIsValidationBypassed, setPollOption]);

    // === SERVICE COMPATIBILITY ===
    const isServiceCompatible = useCallback((service: SmmService, analysis: any) => {
        if (!analysis || analysis.platform === 'OTHER') return true;
        if (analysis.isAmbiguous && !analysis.targetType) return true;

        const detectedType = analysis.targetType;
        const name = service.name.toLowerCase();
        const category = (service.category || '').toLowerCase();
        const dType = (detectedType || '').toUpperCase();
        const sType = (service.targetType || 'ALL').toUpperCase();

        if (name.match(/голос.*опрос|poll.*vote|vote.*poll/i)) {
            return dType === 'POLL';
        }

        if (analysis.smmServices && analysis.smmServices.length > 0) {
            const smmSvcs = analysis.smmServices as string[];
            const catMapped = [];
            if (category.includes('подписчик') || category.includes('follower') || category.includes('member') || category.includes('работники')) {
                 catMapped.push('followers', 'members', 'subscribers');
            }
            if (category.includes('бот') || category.includes('bot')) {
                 catMapped.push('bots', 'members'); 
            }
            if (category.includes('реакц') || category.includes('reaction')) {
                 catMapped.push('reactions');
            }
            if (category.includes('буст') || category.includes('boost')) {
                 catMapped.push('boosts');
            }
            if (category.includes('коммент') || category.includes('comment')) {
                 catMapped.push('comments');
            }
            if (category.includes('звезд') || category.includes('star')) {
                 catMapped.push('stars');
            }
            if (category.includes('истор') || category.includes('stor')) {
                 catMapped.push('stories');
            }

            const isViewCat = category.includes('просмотр') || category.includes('view') || category.includes('глаз');

            if (!isViewCat) {
                if (catMapped.some(c => smmSvcs.includes(c))) {
                    return true;
                }
                return false;
            }
        }

        const isViewService = category.includes('views') || category.includes('просмотр') || name.includes('просмотры') || name.includes('views');
        if (isViewService) {
            const isMassView = name.match(/массов|mass|авто|auto|подписк|sub|будущ|future/i);
            if (dType === 'CHANNEL') {
                return !!isMassView;
            }
            if (dType === 'POST' || dType === 'VIDEO') {
                return !isMassView;
            }
        }

        if (name.includes('комментарии') || name.includes('comments') || category.includes('comments')) {
            return dType === 'POST' || dType === 'VIDEO' || dType === 'REEL' || dType === 'CLIP';
        }

        if (name.includes('подписчики') || name.includes('followers') || category.includes('followers')) {
            return dType === 'CHANNEL' || dType === 'PROFILE';
        }
        if (service.platform === 'MAX') return true;

        if (sType !== 'ALL' && sType !== dType) {
            if ((sType === 'CHANNEL' && dType === 'PROFILE') || (sType === 'PROFILE' && dType === 'CHANNEL')) return true;
            const postTypes = ['POST', 'VIDEO', 'REEL', 'CLIP'];
            if (postTypes.includes(sType) && postTypes.includes(dType)) return true;
            return false;
        }

        return true;
    }, []);

    // === FILTERED SERVICES & CATEGORIES ===
    const availableCategories = useMemo(() => {
        const platformServices = platform
            ? allServices.filter((s: SmmService) => s.platform.toUpperCase() === platform.toUpperCase())
            : allServices;

        if (link.length > 5 && (!platform || platform === 'OTHER')) return [];

        const filteredByTarget = platformServices.filter((s: SmmService) => isServiceCompatible(s, analysisResult));
        const cats = new Set<string>(filteredByTarget.map((s: SmmService) => s.category));
        const uniqueCats = Array.from<string>(cats);
        if (favoriteIds.length > 0) return ['FAVORITES', ...uniqueCats];
        return uniqueCats;
    }, [allServices, favoriteIds, platform, link, analysisResult, isServiceCompatible]);

    const filteredServices = useMemo(() => {
        if (link.length > 5 && (!platform || platform === 'OTHER')) return [];

        const normalize = (p: string) => {
            const u = String(p || '').toUpperCase();
            if (u === 'VKONTAKTE' || u === 'VK') return 'VK';
            if (u === 'TELEGRAM' || u === 'TG') return 'TG';
            if (u === 'INSTAGRAM' || u === 'INST') return 'INST';
            if (u === 'YOUTUBE' || u === 'YT') return 'YT';
            if (u === 'TIKTOK' || u === 'TT') return 'TT';
            return u;
        };

        let result = allServices.filter((s: SmmService) => {
            const isFavTab = selectedCategory === 'FAVORITES';
            const targetPlatform = normalize(platform || '');
            const servicePlatform = normalize(s.platform);

            const name = s.name.toLowerCase();
            const platformKeywords: Record<string, string[]> = {
                VK: ['vk', 'вконтакте'], TG: ['tg', 'telegram', 'телеграм'],
                INST: ['inst', 'instagram', 'инстаграм'], YT: ['yt', 'youtube', 'ютуб'],
                TT: ['tt', 'tiktok', 'тикток'], DISCORD: ['discord', 'дискорд'], DZEN: ['dzen', 'zen', 'дзен'],
            };
            const otherPlatforms = Object.keys(platformKeywords).filter(p => p !== targetPlatform);
            const hasConflict = otherPlatforms.some(p => {
                const keywords = platformKeywords[p];
                const containsOther = keywords.some(k => name.includes(k));
                const containsTarget = targetPlatform !== 'OTHER' && platformKeywords[targetPlatform]?.some(k => name.includes(k));
                return containsOther && !containsTarget;
            });

            const isAnalyzed = link.length > 5 && platform && platform !== 'OTHER';
            const matchesPlatform = !isAnalyzed || isManualMode || (servicePlatform === targetPlatform && !hasConflict);
            if (!matchesPlatform) return false;
            if (!isManualMode && !isServiceCompatible(s, analysisResult)) return false;

            const matchesCategory = isFavTab ? favoriteIds.includes(s.id) : (!selectedCategory || s.category === selectedCategory);
            const matchesSearch = !searchQuery ||
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.numericId || '').toString().includes(searchQuery);
            return matchesCategory && matchesSearch;
        });

        if (activeFilters.length > 0) {
            result = result.filter((s: SmmService) => {
                const name = s.name.toLowerCase();
                return activeFilters.every(f => {
                    switch (f) {
                        case 'TOP': return s.isBest === true;
                        case 'CHEAP': return true;
                        case 'RU_GEO': return name.includes('ру') || name.includes('ru') || name.includes('русск') || name.includes('россий');
                        case 'FAST': return name.includes('моментал') || name.includes('быстр') || name.includes('instant') || name.includes('fast');
                        case 'HQ': return s.quality === 'HIGH' || name.includes('hq') || name.includes('качеств') || name.includes('премиум');
                        default: return true;
                    }
                });
            });

            if (activeFilters.includes('CHEAP')) {
                result = [...result].sort((a, b) => a.pricePer1000 - b.pricePer1000);
            }
        }

        return result;
    }, [allServices, selectedCategory, searchQuery, favoriteIds, platform, link, analysisResult, isManualMode, isServiceCompatible, activeFilters]);

    const toggleFavorite = useCallback((id: string) => {
        const next = favoriteIds.includes(id) ? favoriteIds.filter(fid => fid !== id) : [...favoriteIds, id];
        setFavoriteIds(next);
        localStorage.setItem('smmplan_fav_services', JSON.stringify(next));
        if (session) {
            fetch('/api/client/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviceId: id }),
            }).catch(console.error);
        }
    }, [favoriteIds, session, setFavoriteIds]);

    const toggleFilter = useCallback((filter: ServiceFilter) => {
        setActiveFilters((prev: ServiceFilter[]) => prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]);
    }, [setActiveFilters]);

    // Auto-select first category
    useEffect(() => {
        if (availableCategories.length > 0 && !selectedCategory) {
            setSelectedCategory(availableCategories[0]);
        }
    }, [availableCategories, selectedCategory, setSelectedCategory]);

    return {
        availableCategories,
        filteredServices,
        toggleFavorite,
        toggleFilter
    };
}

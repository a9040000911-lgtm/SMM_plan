import { useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { analyzeLink, mapObjectTypeToTargetType } from '@/utils/link-analyzer';

export function useLinkAnalysis(
    link: string,
    session: any,
    initialServiceId: string | undefined,
    state: any
) {
    const {
        setIsAnalyzing, setIsLinkInvalid, setIsAmbiguous, setAmbiguityInfo,
        setPlatform, setAnalysisResult, setIsManualMode, setDetectedTargetType,
        platform, setSelectedCategory, setSelectedService, setIsValidationBypassed
    } = state;

    // === LINK ANALYSIS ===
    useEffect(() => {
        if (link.length > 5) {
            setIsAnalyzing(true);
            const timer = setTimeout(() => {
                setIsAnalyzing(false);
                const analysis = analyzeLink(link) as any;

                if (analysis) {
                    setIsLinkInvalid(false);

                    if (analysis.isAmbiguous) {
                        setIsAmbiguous(true);
                        setAmbiguityInfo(analysis.ambiguity);
                        setPlatform(analysis.platform as string);
                        setAnalysisResult(analysis);
                    } else {
                        setIsAmbiguous(false);
                        setAmbiguityInfo(null);

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
                                isPrivate: analysis.isPrivate || false,
                                isEmailRequired: !session,
                                smmServices: analysis.smmServices,
                            });
                        }
                    }
                } else if (!initialServiceId) {
                    setIsLinkInvalid(link.length > 5);
                    setIsAmbiguous(false);
                    setAmbiguityInfo(null);
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
    }, [link, session, initialServiceId, platform, setIsAnalyzing, setIsLinkInvalid, setIsAmbiguous, setAmbiguityInfo, setPlatform, setAnalysisResult, setIsManualMode, setDetectedTargetType, setSelectedCategory, setSelectedService, setIsValidationBypassed]);

    // Link input error type detection
    const linkInputHint = useMemo(() => {
        if (!link || link.length < 3) return null;
        if (link.includes('@') && link.includes('.') && !link.includes('/')) {
            return { type: 'error' as const, message: 'Это email. Вставьте ссылку на соцсеть (https://...)' };
        }
        if (link.length > 5 && !link.startsWith('http') && !link.startsWith('t.me') && !link.startsWith('vk.com') && !link.startsWith('instagram.com')) {
            return { type: 'warning' as const, message: 'Ссылка должна начинаться с https://' };
        }
        return null;
    }, [link]);

    // Brand color for detected platform
    const activeBrandColor = useMemo(() => {
        switch (platform) {
            case 'TELEGRAM': return '#0088CC';
            case 'INSTAGRAM': return '#E1306C';
            case 'VK': return '#0077FF';
            case 'YOUTUBE': return '#FF0000';
            case 'TIKTOK': return '#ff0050';
            case 'TWITTER': return '#1DA1F2';
            case 'FACEBOOK': return '#1877F2';
            default: return '#3b82f6';
        }
    }, [platform]);

    const handleResolveAmbiguity = useCallback((option: any) => {
        setIsAmbiguous(false);
        setAmbiguityInfo(null);
        const tType = mapObjectTypeToTargetType(option.id.toUpperCase());
        setDetectedTargetType(tType);
        setAnalysisResult((prev: any) => ({
            ...prev,
            targetType: tType,
            objectType: option.id.toUpperCase(),
            smmServices: option.smm_services || prev?.smmServices,
        }));
        toast.success(`Тип определен: ${option.label}`, { icon: '🎯', id: 'type-resolved' });
    }, [setIsAmbiguous, setAmbiguityInfo, setDetectedTargetType, setAnalysisResult]);

    return {
        linkInputHint,
        activeBrandColor,
        handleResolveAmbiguity
    };
}

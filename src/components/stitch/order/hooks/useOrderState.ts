import { useState } from 'react';
import { SmmService, ServiceFilter } from './types';

export function useOrderState(initialLink?: string) {
    // === LINK STATE ===
    const [link, setLink] = useState(initialLink || '');
    const [platform, setPlatform] = useState<string | null>(null);
    const [detectedTargetType, setDetectedTargetType] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isLinkInvalid, setIsLinkInvalid] = useState(false);
    const [isAmbiguous, setIsAmbiguous] = useState(false);
    const [ambiguityInfo, setAmbiguityInfo] = useState<any>(null);
    const [isManualMode, setIsManualMode] = useState(false);
    const [isValidationBypassed, setIsValidationBypassed] = useState(false);

    // === SERVICES STATE ===
    const [allServices, setAllServices] = useState<SmmService[]>([]);
    const [isLoadingServices, setIsLoadingServices] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedService, setSelectedService] = useState<SmmService | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
    const [activeFilters, setActiveFilters] = useState<ServiceFilter[]>([]);

    // === CONFIG STATE ===
    const [quantity, setQuantity] = useState(0);
    const [isDripFeed, setIsDripFeed] = useState(false);
    const [runs, setRuns] = useState(2);
    const [interval, setIntervalValue] = useState(30);
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduleTime, setScheduleTime] = useState('');
    const [repeatInterval, setRepeatInterval] = useState<number | ''>('');

    // === AUTH STATE ===
    const [email, setEmail] = useState('');
    const [authMode, setAuthMode] = useState<'PASSWORD' | 'MAGIC' | null>(null);
    const [password, setPassword] = useState('');
    const [magicCode, setMagicCode] = useState('');
    const [isSendingCode, setIsSendingCode] = useState(false);

    // === SUBMISSION STATE ===
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pollOption, setPollOption] = useState<number | null>(null);

    return {
        link, setLink,
        platform, setPlatform,
        detectedTargetType, setDetectedTargetType,
        analysisResult, setAnalysisResult,
        isAnalyzing, setIsAnalyzing,
        isLinkInvalid, setIsLinkInvalid,
        isAmbiguous, setIsAmbiguous,
        ambiguityInfo, setAmbiguityInfo,
        isManualMode, setIsManualMode,
        isValidationBypassed, setIsValidationBypassed,
        allServices, setAllServices,
        isLoadingServices, setIsLoadingServices,
        selectedCategory, setSelectedCategory,
        selectedService, setSelectedService,
        searchQuery, setSearchQuery,
        favoriteIds, setFavoriteIds,
        activeFilters, setActiveFilters,
        quantity, setQuantity,
        isDripFeed, setIsDripFeed,
        runs, setRuns,
        interval, setIntervalValue,
        isScheduled, setIsScheduled,
        scheduleTime, setScheduleTime,
        repeatInterval, setRepeatInterval,
        email, setEmail,
        authMode, setAuthMode,
        password, setPassword,
        magicCode, setMagicCode,
        isSendingCode, setIsSendingCode,
        isSubmitting, setIsSubmitting,
        error, setError,
        pollOption, setPollOption
    };
}

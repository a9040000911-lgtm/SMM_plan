'use client';
/**
 * useOrderFlow — Core business logic hook for the Order Modal
 * Modularized over 5 sub-hooks:
 * - useOrderState
 * - useLinkAnalysis
 * - useServiceFiltering
 * - useOrderAuth
 * - useOrderSubmission
 */

import { useSession } from 'next-auth/react';
import { useOrderState } from './useOrderState';
import { useLinkAnalysis } from './useLinkAnalysis';
import { useServiceFiltering } from './useServiceFiltering';
import { useOrderAuth } from './useOrderAuth';
import { useOrderSubmission } from './useOrderSubmission';

export type { SmmService, ServiceFilter } from './types';

export function useOrderFlow(initialServiceId?: string, initialLink?: string) {
    const { data: session } = useSession();

    // 1. Initialize all state
    const state = useOrderState(initialLink);

    // 2. Link Analysis
    const { 
        linkInputHint, activeBrandColor, handleResolveAmbiguity 
    } = useLinkAnalysis(state.link, session, initialServiceId, state);

    // 3. Service Filtering & Loading
    const { 
        availableCategories, filteredServices, toggleFavorite, toggleFilter 
    } = useServiceFiltering(
        session, initialServiceId, state, state.analysisResult, state.platform, 
        state.link, state.isManualMode, state.selectedCategory, 
        state.searchQuery, state.favoriteIds, state.activeFilters
    );

    // 4. Auth & Validation
    const { 
        handleEmailBlur, handleSendMagicCode, isEmailValid, isAuthValid, isAuthParamsValid 
    } = useOrderAuth(session, state);

    const isLinkValid = state.link.length > 5;

    // 5. Submission & Final validations
    const {
        isQtyMultiple, isQuantityValid, validationError, canSubmit, totalPrice,
        handleAddToCart, handleOrder
    } = useOrderSubmission(
        session, state, state.analysisResult, isLinkValid, isAuthValid, isAuthParamsValid
    );

    return {
        // Flat State matching the original hook return signature
        link: state.link, setLink: state.setLink,
        platform: state.platform, setPlatform: state.setPlatform,
        detectedTargetType: state.detectedTargetType,
        analysisResult: state.analysisResult,
        isAnalyzing: state.isAnalyzing,
        isLinkInvalid: state.isLinkInvalid,
        isAmbiguous: state.isAmbiguous, ambiguityInfo: state.ambiguityInfo,
        isManualMode: state.isManualMode,
        allServices: state.allServices, isLoadingServices: state.isLoadingServices,
        selectedCategory: state.selectedCategory, setSelectedCategory: state.setSelectedCategory,
        selectedService: state.selectedService, setSelectedService: state.setSelectedService,
        searchQuery: state.searchQuery, setSearchQuery: state.setSearchQuery,
        favoriteIds: state.favoriteIds, activeFilters: state.activeFilters,
        quantity: state.quantity, setQuantity: state.setQuantity,
        isDripFeed: state.isDripFeed, setIsDripFeed: state.setIsDripFeed,
        runs: state.runs, setRuns: state.setRuns,
        interval: state.interval, setInterval: state.setIntervalValue,
        isScheduled: state.isScheduled, setIsScheduled: state.setIsScheduled,
        scheduleTime: state.scheduleTime, setScheduleTime: state.setScheduleTime,
        repeatInterval: state.repeatInterval, setRepeatInterval: state.setRepeatInterval,
        email: state.email, setEmail: state.setEmail,
        authMode: state.authMode, setAuthMode: state.setAuthMode,
        password: state.password, setPassword: state.setPassword,
        magicCode: state.magicCode, setMagicCode: state.setMagicCode,
        isSendingCode: state.isSendingCode,
        isSubmitting: state.isSubmitting, error: state.error, setError: state.setError,
        isValidationBypassed: state.isValidationBypassed, setIsValidationBypassed: state.setIsValidationBypassed,
        pollOption: state.pollOption, setPollOption: state.setPollOption,

        // Computed
        availableCategories,
        filteredServices,
        isQtyMultiple,
        isLinkValid,
        isQuantityValid,
        isAuthValid,
        validationError,
        canSubmit,
        totalPrice,
        linkInputHint,
        activeBrandColor,

        // Actions
        handleResolveAmbiguity,
        handleEmailBlur,
        handleSendMagicCode,
        handleAddToCart,
        handleOrder,
        toggleFavorite,
        toggleFilter,
    };
}

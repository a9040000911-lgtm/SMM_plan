"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SerializedService, AdminProvider, SerializedOverride, SerializedMapping } from '@/types/admin';

interface ServiceDashboardContextType {
    search: string;
    setSearch: (v: string) => void;
    selectedPlatform: string;
    setSelectedPlatform: (v: string) => void;
    selectedCategory: string;
    setSelectedCategory: (v: string) => void;
    selectedProvider: string;
    setSelectedProvider: (v: string) => void;
    statusFilter: 'all' | 'active' | 'inactive';
    setStatusFilter: (v: 'all' | 'active' | 'inactive') => void;
    selectedProviderSku: string;
    setSelectedProviderSku: (v: string) => void;
    selectedInternalId: string;
    setSelectedInternalId: (v: string) => void;

    currentPage: number;
    setCurrentPage: (v: number) => void;
    pageSize: number;
    totalPages: number;

    services: SerializedService[];
    setServices: React.Dispatch<React.SetStateAction<SerializedService[]>>;
    filteredServices: SerializedService[];
    paginatedServices: SerializedService[];

    selectedIds: string[];
    setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;

    isRepairing: boolean;
    setIsRepairing: (v: boolean) => void;
    isSyncing: boolean;
    setIsSyncing: (v: boolean) => void;
    syncingProviderId: string | null;
    setSyncingProviderId: (id: string | null) => void;
    isImportOpen: boolean;
    setIsImportOpen: (v: boolean) => void;

    isGlobal: boolean;
    activeProjectId: string | null;
    providers: AdminProvider[];
    categories: any[]; // Categories are harder to type deeply here, but usually string[] or special obj
    projects: any[];
    overrides: SerializedOverride[];
    platforms: string[];
    categoriesList: string[];
}

const ServiceDashboardContext = createContext<ServiceDashboardContextType | undefined>(undefined);

export function ServiceDashboardProvider({
    children,
    initialServices,
    providers,
    categories,
    projects,
    overrides,
    activeProjectId,
    defaultProviderId
}: {
    children: React.ReactNode;
    initialServices: SerializedService[];
    providers: AdminProvider[];
    categories: any[];
    projects: any[];
    overrides: SerializedOverride[];
    activeProjectId: string | null;
    defaultProviderId?: string;
}) {
    const searchParams = useSearchParams();
    const urlPlatform = searchParams.get('platform');
    const urlCategory = searchParams.get('category');

    const [search, setSearch] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState(urlPlatform || 'all');
    const [selectedCategory, setSelectedCategory] = useState(urlCategory || 'all');
    const [selectedProvider, setSelectedProvider] = useState(defaultProviderId || 'all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [selectedProviderSku, setSelectedProviderSku] = useState('');
    const [selectedInternalId, setSelectedInternalId] = useState('');

    // Sync from URL if it changes
    useEffect(() => {
        if (urlPlatform) setSelectedPlatform(urlPlatform);
        if (urlCategory) setSelectedCategory(urlCategory);
    }, [urlPlatform, urlCategory]);

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    const [services, setServices] = useState(initialServices);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [isRepairing, setIsRepairing] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncingProviderId, setSyncingProviderId] = useState<string | null>(null);
    const [isImportOpen, setIsImportOpen] = useState(false);

    const isGlobal = !activeProjectId || activeProjectId === 'all';

    const platforms = useMemo(() => {
        const p = new Set(services.map(s => s.platform));
        return Array.from(p).sort();
    }, [services]);

    const categoriesList = useMemo(() => {
        const c = new Set(services.map(s => s.category));
        return Array.from(c).sort();
    }, [services]);

    const filteredServices = useMemo(() => {
        return services.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
            const matchesId = !selectedInternalId || s.id.toLowerCase().includes(selectedInternalId.toLowerCase());
            const matchesPlatform = selectedPlatform === 'all' || s.platform === selectedPlatform;
            const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;

            const matchesProviderSku = !selectedProviderSku || s.providerMappings.some((m: SerializedMapping) =>
                m.providerServiceId.toString().includes(selectedProviderSku)
            );
            const matchesProvider = selectedProvider === 'all' || s.providerMappings.some((m: SerializedMapping) => m.providerId === selectedProvider);

            const override = overrides.find(o => o.internalServiceId === s.id);
            const isActive = isGlobal ? s.isActive : (override ? override.isActive : false);

            const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? isActive : !isActive);

            return matchesSearch && matchesId && matchesPlatform && matchesCategory && matchesStatus && matchesProvider && matchesProviderSku;
        });
    }, [services, search, selectedInternalId, selectedPlatform, selectedCategory, statusFilter, selectedProvider, selectedProviderSku, overrides, isGlobal]);

    const totalPages = Math.ceil(filteredServices.length / pageSize);
    const paginatedServices = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredServices.slice(start, start + pageSize);
    }, [filteredServices, currentPage, pageSize]);

    // Reset page on filter change
    useMemo(() => {
        setCurrentPage(1);
    }, [search, selectedPlatform, selectedCategory, statusFilter, selectedProvider, selectedProviderSku, selectedInternalId]);

    return (
        <ServiceDashboardContext.Provider value={{
            search, setSearch,
            selectedPlatform, setSelectedPlatform,
            selectedCategory, setSelectedCategory,
            selectedProvider, setSelectedProvider,
            statusFilter, setStatusFilter,
            selectedProviderSku, setSelectedProviderSku,
            selectedInternalId, setSelectedInternalId,
            services, setServices,
            filteredServices,
            paginatedServices: paginatedServices,
            currentPage, setCurrentPage,
            pageSize, totalPages,
            selectedIds, setSelectedIds,
            isRepairing, setIsRepairing,
            isSyncing, setIsSyncing,
            syncingProviderId, setSyncingProviderId,
            isImportOpen, setIsImportOpen,
            isGlobal, activeProjectId,
            providers, categories, projects, overrides,
            platforms, categoriesList
        }}>
            {children}
        </ServiceDashboardContext.Provider>
    );
}

export function useServiceDashboard() {
    const context = useContext(ServiceDashboardContext);
    if (!context) throw new Error('useServiceDashboard must be used within ServiceDashboardProvider');
    return context;
}

'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { createContext, useContext } from 'react';

interface Project {
    id: string;
    name: string;
    brandColor: string;
}

interface AdminContextType {
    activeProjectId: string | null;
    projects: Project[];
    isGlobal: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({
    children,
    initialProjectId,
    initialProjects
}: {
    children: React.ReactNode;
    initialProjectId: string | null;
    initialProjects: Project[];
}) {
    const isGlobal = !initialProjectId || initialProjectId === 'all';

    return (
        <AdminContext.Provider value={{
            activeProjectId: initialProjectId,
            projects: initialProjects,
            isGlobal
        }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (context === undefined) {
        // Return a default value if not wrapped in Provider to avoid hard crashes 
        // in pages that don't need it but use AdminHeader with defaults
        return { activeProjectId: null, projects: [], isGlobal: true };
    }
    return context;
}

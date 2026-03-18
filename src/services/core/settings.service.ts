/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';

export class SettingsService {
    /**
     * Retrieves a setting value by key, optionally for a specific project.
     * Falls back to global setting (projectId: null) if project-specific one is missing.
     */
    static async get(key: string, projectId?: string | null): Promise<string | null> {
        // 1. Try project-specific setting
        if (projectId) {
            const pSetting = await prisma.settings.findUnique({
                where: {
                    projectId_key: {
                        projectId,
                        key
                    }
                }
            });
            if (pSetting) return pSetting.value;
        }

        // 2. Try global setting
        const gSetting = await prisma.settings.findFirst({
            where: {
                projectId: null,
                key
            }
        });

        return gSetting?.value ?? null;
    }

    /**
     * Retrieves a setting and parses it as JSON
     */
    static async getJson<T>(key: string, projectId?: string | null): Promise<T | null> {
        const value = await this.get(key, projectId);
        if (!value) return null;
        try {
            return JSON.parse(value) as T;
        } catch (e) {
            console.error(`Failed to parse setting ${key} as JSON:`, e);
            return null;
        }
    }

    /**
     * Retrieves a setting and parses it as number
     */
    static async getNumber(key: string, projectId?: string | null, defaultValue: number = 0): Promise<number> {
        const value = await this.get(key, projectId);
        if (!value) return defaultValue;
        const num = parseFloat(value);
        return isNaN(num) ? defaultValue : num;
    }

    /**
     * Sets a setting value, optionally for a specific project.
     */
    static async set(key: string, value: string, projectId?: string | null): Promise<void> {
        if (projectId) {
            await prisma.settings.upsert({
                where: { projectId_key: { projectId, key } },
                update: { value },
                create: { projectId, key, value }
            });
        } else {
            // Global setting
            // We use findFirst to find if it exists since projectId is nullable and unique constraint might behave differently depending on DB
            // But schema says @@unique([projectId, key]), so for global projectId is null.
            // Prisma upsert requires unique input. projectId_key works if projectId is null? 
            // In PostgreSQL unique index allows multiple nulls unless defined otherwise, but Prisma handles it.
            // Let's rely on finding first for now to be safe or use upsert if schema supports it safely.
            // Actually, for global settings, let's just use findFirst and update/create.
            const existing = await prisma.settings.findFirst({ where: { key, projectId: null } });
            if (existing) {
                await prisma.settings.update({ where: { id: existing.id }, data: { value } });
            } else {
                await prisma.settings.create({ data: { key, value, projectId: null } });
            }
        }
    }
}



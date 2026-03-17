/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { ServiceResult } from '../types';

const CACHE_TTL = 3600; // 1 hour
const CACHE_PREFIX = 'cms:v3:';

export class CmsService {
    /**
     * Internal helper to handle Redis caching
     */
    private static async getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
        try {
            const cached = await redis.get(key);
            if (cached) return JSON.parse(cached);
        } catch (e) {
            console.warn(`[CMS Cache] Error reading key ${key}:`, e);
        }

        const data = await fetcher();
        
        try {
            await redis.set(key, JSON.stringify(data), 'EX', CACHE_TTL);
        } catch (e) {
            console.warn(`[CMS Cache] Error writing key ${key}:`, e);
        }
        
        return data;
    }

    /**
     * Clears cache for a project and page
     */
    static async invalidateCache(projectId: string, pageSlug?: string) {
        try {
            const keys = [
                `${CACHE_PREFIX}strings:${projectId}:global`,
                `${CACHE_PREFIX}blocks:${projectId}:home`
            ];
            if (pageSlug) {
                keys.push(`${CACHE_PREFIX}strings:${projectId}:${pageSlug}`);
                keys.push(`${CACHE_PREFIX}blocks:${projectId}:${pageSlug}`);
            }
            await Promise.all(keys.map(k => redis.del(k)));
            console.log(`[CMS Cache] Invalidated keys for project ${projectId}`);
        } catch (e) {
            console.error('[CMS Cache] Invalidation error:', e);
        }
    }

    /**
     * Fetches all CMS strings for a specific project.
     * Priority: Page-specific string > Global string.
     */
    static async getProjectStrings(projectId: string | null, pageSlug?: string): Promise<Record<string, string>> {
        if (!projectId) return {};

        const cacheKey = `${CACHE_PREFIX}strings:${projectId}:${pageSlug || 'global'}`;

        return this.getCached(cacheKey, async () => {
            // 1. Fetch global strings (where pageId is null)
            const globalSettings = await prisma.cmsString.findMany({
                where: {
                    projectId,
                    pageId: null,
                    isPublished: true
                }
            });

            const strings: Record<string, string> = {};
            globalSettings.forEach(s => {
                strings[s.key] = s.value;
            });

            // 2. Fetch page-specific strings if slug is provided
            if (pageSlug) {
                const pageSettings = await prisma.cmsString.findMany({
                    where: {
                        projectId,
                        page: { slug: pageSlug },
                        isPublished: true
                    }
                });
                pageSettings.forEach(s => {
                    strings[s.key] = s.value; // Override global with page-specific
                });
            }

            // 3. Fallback to legacy Settings table for backward compatibility during migration
            if (Object.keys(strings).length === 0) {
                const legacySettings = await prisma.settings.findMany({
                    where: {
                        projectId,
                        key: { startsWith: 'cms.' }
                    }
                });
                legacySettings.forEach(s => {
                    const cleanKey = s.key.replace('cms.', '');
                    if (!strings[cleanKey]) strings[cleanKey] = s.value;
                });
            }

            return strings;
        });
    }

    /**
     * Fetches CMS blocks (widgets) for a specific page of a project.
     */
    static async getProjectBlocks(projectId: string | null, pageSlug: string = 'home'): Promise<any[]> {
        if (!projectId) return [];

        const cacheKey = `${CACHE_PREFIX}blocks:${projectId}:${pageSlug}`;

        return this.getCached(cacheKey, async () => {
            // Try to fetch from new relational model
            const blocks = await prisma.cmsBlock.findMany({
                where: {
                    page: {
                        projectId,
                        slug: pageSlug
                    },
                    isPublished: true
                },
                orderBy: { order: 'asc' }
            });

            if (blocks.length > 0) {
                return blocks.map(b => ({
                    id: b.id,
                    type: b.type,
                    slot: b.slot,
                    data: b.content
                }));
            }

            // Fallback to legacy Project.config for backward compatibility
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { config: true }
            });

            const config = (project?.config as any) || {};
            return config.cmsBlocks || [];
        });
    }

    /**
     * Syncs legacy JSON blocks to the new relational model (One-time/Manual trigger)
     */
    static async migrateLegacyBlocks(projectId: string, pageSlug: string = 'home'): Promise<void> {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { config: true }
        });

        const config = (project?.config as any) || {};
        const legacyBlocks = config.cmsBlocks || [];

        if (legacyBlocks.length === 0) return;

        // Ensure page exists
        let page = await prisma.cmsPage.findUnique({
            where: { projectId_slug: { projectId, slug: pageSlug } }
        });

        if (!page) {
            page = await prisma.cmsPage.create({
                data: {
                    projectId,
                    slug: pageSlug,
                    title: pageSlug
                }
            });
        }

        // Migrate blocks if they don't exist yet
        const data = legacyBlocks.map((lb: any, i: number) => ({
            pageId: page!.id,
            type: lb.type,
            slot: lb.slot || 'DEFAULT',
            content: lb.data || {},
            order: i,
            isPublished: true
        }));

        await prisma.cmsBlock.createMany({ data });

        // Clear legacy config once migrated (optional, safety first)
        // await prisma.project.update({ where: { id: projectId }, data: { config: { ...config, cmsBlocks: [] } } });
        await this.invalidateCache(projectId, pageSlug);
    }

    /**
     * Helper to get a single string with fallback.
     */
    static async getString(projectId: string | null, key: string, fallback: string, pageSlug?: string): Promise<string> {
        if (!projectId) return fallback;
        
        const strings = await this.getProjectStrings(projectId, pageSlug);
        return strings[key] || fallback;
    }

    /**
     * Fetches approved reviews for a project.
     */
    static async getApprovedReviews(projectId: string | null, limit: number = 12): Promise<ServiceResult<any[]>> {
        try {
            const reviews = await prisma.review.findMany({
                where: {
                    projectId: projectId || undefined,
                    status: 'APPROVED'
                },
                orderBy: { createdAt: 'desc' },
                take: limit
            });
            return { success: true, data: reviews };
        } catch (error: any) {
            return {
                success: false,
                error: { code: 'REVIEWS_FETCH_FAILED', message: error.message }
            };
        }
    }

    /**
     * Fetches a single legal document by slug.
     */
    static async getLegalDocument(projectId: string, slug: string): Promise<ServiceResult<any>> {
        try {
            const document = await (prisma as any).legalDocument.findUnique({
                where: {
                    projectId_slug: { projectId, slug }
                }
            });

            if (!document) throw new Error('Документ не найден');

            return { success: true, data: document };
        } catch (error: any) {
            return {
                success: false,
                error: { code: 'LEGAL_DOC_FETCH_FAILED', message: error.message }
            };
        }
    }

    /**
     * Fetches all active legal documents for a project.
     */
    static async getAllLegalDocuments(projectId: string): Promise<ServiceResult<any[]>> {
        try {
            const documents = await (prisma as any).legalDocument.findMany({
                where: { projectId, isActive: true },
                select: { slug: true, title: true }
            });
            return { success: true, data: documents };
        } catch (error: any) {
            return {
                success: false,
                error: { code: 'LEGAL_DOCS_LIST_FAILED', message: error.message }
            };
        }
    }
}

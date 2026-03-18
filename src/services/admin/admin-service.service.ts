/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from "@/lib/prisma";
import { AdminServiceResult, AdminContext } from '@/services/types';
import { BaseAdminService } from "./base-admin.service";
import { Decimal } from "decimal.js";
import { z } from "zod";
import { PricingService } from "../finance/pricing.service";
import { safeAdminExecute } from "../utils";

export class AdminServiceService extends BaseAdminService {
    private static instance: AdminServiceService;

    private constructor() {
        super('AdminService');
    }

    public static getInstance(): AdminServiceService {
        if (!AdminServiceService.instance) {
            AdminServiceService.instance = new AdminServiceService();
        }
        return AdminServiceService.instance;
    }

    /**
     * Toggles service active status globally or in a project.
     */
    async toggleServiceStatus(ctx: AdminContext, serviceId: string, isActive: boolean): Promise<AdminServiceResult<any>> {
        return safeAdminExecute(ctx, 'TOGGLE_SERVICE_STATUS', async () => {
            await prisma.internalService.update({
                where: { id: serviceId },
                data: { isActive }
            });

            return { serviceId, isActive };
        }, serviceId);
    }

    /**
     * Toggles service status for all projects.
     */
    async bulkToggleServiceForAllProjects(ctx: AdminContext, serviceId: string, isActive: boolean): Promise<AdminServiceResult<any>> {
        try {
            if (!ctx.isGlobalAdmin) throw new Error('Global Admin required');

            const projects = await prisma.project.findMany({ select: { id: true } });

            await Promise.all(projects.map(project =>
                prisma.projectServiceOverride.upsert({
                    where: {
                        projectId_internalServiceId: {
                            projectId: project.id,
                            internalServiceId: serviceId
                        }
                    },
                    update: { isActive },
                    create: {
                        projectId: project.id,
                        internalServiceId: serviceId,
                        isActive
                    }
                })
            ));

            await this.logAction(ctx, 'BULK_TOGGLE_SERVICE', `Service ${serviceId} bulk active: ${isActive}`, serviceId);
            return this.success({ count: projects.length });
        } catch (error: any) {
            return this.error('SERVICE_BULK_TOGGLE_FAILED', error.message, error);
        }
    }

    /**
     * Deletes or deactivates a service.
     */
    async deleteService(ctx: AdminContext, serviceId: string): Promise<AdminServiceResult<any>> {
        try {
            const ordersCount = await prisma.order.count({ where: { internalServiceId: serviceId } });

            if (ordersCount > 0) {
                await prisma.internalService.update({
                    where: { id: serviceId },
                    data: { isActive: false }
                });
                return this.success({ action: 'DEACTIVATED', message: 'Service deactivated (has orders)' });
            }

            await prisma.internalService.delete({ where: { id: serviceId } });
            await this.logAction(ctx, 'DELETE_SERVICE', `Deleted service ${serviceId}`, serviceId);
            return this.success({ action: 'DELETED' });
        } catch (error: any) {
            return this.error('SERVICE_DELETE_FAILED', error.message, error);
        }
    }

    /**
     * Updates an internal service.
     */
    async updateService(ctx: AdminContext, serviceId: string, data: any, activeProjectId?: string): Promise<AdminServiceResult<any>> {
        return safeAdminExecute(ctx, 'UPDATE_SERVICE', async () => {
            const ServiceUpdateSchema = z.object({
                name: z.string().min(1).optional(),
                description: z.string().optional(),
                pricePer1000: z.number().positive().optional(),
                minQty: z.number().int().positive().optional(),
                maxQty: z.number().int().positive().optional(),
                isActive: z.boolean().optional(),
                platform: z.string().optional(),
                category: z.string().optional(),
                categoryId: z.string().nullable().optional(),
                targetType: z.string().optional(),
                allowedTargetTypes: z.array(z.string()).optional(),
                requirements: z.string().optional(),
                marketPrice: z.number().nullable().optional(),
                markup: z.number().min(0).max(15000).optional(),
                avgCompletionTime: z.number().optional(),
            });

            const validatedData = ServiceUpdateSchema.parse(data) as any;

            if (ctx.role === 'SEO') {
                const allowedFields = ['name', 'description', 'requirements'];
                const forbiddenFields = Object.keys(data).filter(f => !allowedFields.includes(f));
                if (forbiddenFields.length > 0) {
                    throw new Error(`Forbidden: Role SEO is not authorized to update fields: ${forbiddenFields.join(', ')}`);
                }
            }

            const oldService = await prisma.internalService.findUnique({
                where: { id: serviceId },
                select: { pricePer1000: true, markup: true, lastProviderPrice: true, category: true, platform: true }
            });

            if (!oldService) throw new Error('Service not found');

            // Logic for automatic price calculation if markup is updated or price is missing
            if (validatedData.markup !== undefined || validatedData.pricePer1000 === undefined) {
                if (oldService.lastProviderPrice && validatedData.markup !== undefined) {
                    validatedData.pricePer1000 = await PricingService.calculateRetailPrice(oldService.lastProviderPrice, {
                        category: oldService.category as any,
                        projectId: ctx.isGlobalAdmin ? undefined : (activeProjectId || ctx.allowedProjects[0])
                    });
                }
            }

            const updateData: any = { ...validatedData };
            if (updateData.pricePer1000) updateData.pricePer1000 = new Decimal(updateData.pricePer1000);
            if (updateData.marketPrice !== undefined) updateData.marketPrice = updateData.marketPrice ? new Decimal(updateData.marketPrice) : null;
            if (updateData.categoryId === '') updateData.categoryId = null;

            const isProjectScope = activeProjectId && activeProjectId !== 'all';

            await prisma.$transaction(async (tx) => {
                const globalUpdateData = { ...updateData };

                if (isProjectScope && updateData.categoryId !== undefined) {
                    delete globalUpdateData.categoryId;
                    await tx.projectServiceOverride.upsert({
                        where: { projectId_internalServiceId: { projectId: activeProjectId, internalServiceId: serviceId } },
                        update: { categoryId: updateData.categoryId },
                        create: { projectId: activeProjectId, internalServiceId: serviceId, categoryId: updateData.categoryId, isActive: true }
                    });
                }

                await tx.internalService.update({
                    where: { id: serviceId },
                    data: {
                        ...(globalUpdateData as any),
                        requirements: globalUpdateData.requirements || undefined,
                        description: globalUpdateData.description || undefined,
                    }
                });

                // Audit
                if (updateData.pricePer1000 && !new Decimal(updateData.pricePer1000).equals(oldService.pricePer1000)) {
                    await this.logServiceChange(tx, serviceId, 'PRICE_CHANGE', oldService.pricePer1000.toString(), updateData.pricePer1000.toString());
                }
                if (updateData.markup !== undefined && Number(updateData.markup) !== Number(oldService.markup || 0)) {
                    await this.logServiceChange(tx, serviceId, 'MARKUP_CHANGE', oldService.markup?.toString() || '0', updateData.markup.toString());
                }
            });

            return { id: serviceId };
        }, serviceId);
    }

    /**
     * Gets internal services with optional filtering.
     */
    async getInternalServices(ctx: AdminContext, filters: { platform?: any, category?: any, search?: string, take?: number }): Promise<AdminServiceResult<any[]>> {
        try {
            const where: any = {};
            if (filters.platform && filters.platform !== 'ALL') where.platform = filters.platform;
            if (filters.category && filters.category !== 'ALL') where.category = filters.category;
            if (filters.search) {
                where.OR = [
                    { id: { contains: filters.search, mode: 'insensitive' } },
                    { name: { contains: filters.search, mode: 'insensitive' } },
                ];
            }

            const services = await prisma.internalService.findMany({
                where,
                select: { id: true, name: true, platform: true, category: true, isActive: true },
                orderBy: { name: 'asc' },
                take: filters.take || 100
            });

            return this.success(services);
        } catch (error: any) {
            return this.error('SERVICES_FETCH_FAILED', error.message, error);
        }
    }

    /**
     * Logs service changes (price, markup).
     */
    private async logServiceChange(tx: any, serviceId: string, type: string, oldValue: string | null, newValue: string | null, reason: string = 'Admin Panel') {
        await tx.serviceChangeLog.create({
            data: {
                internalServiceId: serviceId,
                type,
                oldValue,
                newValue,
                reason
            }
        });
    }

    /**
     * Upserts a service category.
     */
    async upsertServiceCategory(ctx: AdminContext, id: string | undefined, data: any): Promise<AdminServiceResult<any>> {
        try {
            const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const payload = {
                name: data.name,
                slug,
                platform: data.platform,
                categoryType: data.categoryType || 'OTHER',
                targetType: data.targetType || 'POST',
                description: data.description || null,
                priority: data.priority || 0,
                icon: data.icon || null
            };

            const targetProjectId = data.projectId === 'all' ? null : (data.projectId || null);

            let category;
            if (id) {
                const existing = await prisma.serviceCategory.findUnique({ where: { id } });
                if (existing && existing.projectId === null && targetProjectId && targetProjectId !== 'all') {
                    category = await prisma.serviceCategory.create({ data: { ...payload, projectId: targetProjectId } });
                } else {
                    category = await prisma.serviceCategory.update({ where: { id }, data: payload });
                }
            } else {
                const existing = await prisma.serviceCategory.findFirst({
                    where: { projectId: targetProjectId, platform: data.platform, name: data.name }
                });

                if (existing) {
                    category = await prisma.serviceCategory.update({ where: { id: existing.id }, data: payload });
                } else {
                    category = await prisma.serviceCategory.create({ data: { ...payload, projectId: targetProjectId } });
                }
            }

            await this.logAction(ctx, 'UPSERT_CATEGORY', `Upserted category ${data.name}`, category.id);
            return this.success(category);
        } catch (error: any) {
            return this.error('CATEGORY_UPSERT_FAILED', error.message, error);
        }
    }

    /**
     * Unlinks/deletes a provider service mapping.
     */
    async unlinkProviderService(ctx: AdminContext, mappingId: string): Promise<AdminServiceResult<any>> {
        try {
            const mapping = await prisma.internalServiceMapping.findUnique({ where: { id: mappingId } });
            if (!mapping) throw new Error('Mapping not found');

            await prisma.internalServiceMapping.delete({ where: { id: mappingId } });

            await this.logAction(ctx, 'UNLINK_PROVIDER_SERVICE', `Unlinked mapping ${mappingId}`, mappingId);
            return this.success({ id: mappingId });
        } catch (error: any) {
            return this.error('PROVIDER_UNLINK_FAILED', error.message, error);
        }
    }

    /**
     * Gets service categories.
     */
    async getServiceCategories(ctx: AdminContext, projectId: string): Promise<AdminServiceResult<any[]>> {
        try {
            const where: any = {};
            if (projectId === 'all') {
                where.projectId = null;
            } else if (projectId) {
                where.projectId = projectId;
            }

            const categories = await prisma.serviceCategory.findMany({
                where,
                orderBy: { priority: 'asc' },
                include: { _count: { select: { internalServices: true } } }
            });

            return this.success(categories);
        } catch (error: any) {
            return this.error('CATEGORIES_FETCH_FAILED', error.message, error);
        }
    }

    /**
     * Deletes a service category.
     */
    async deleteServiceCategory(ctx: AdminContext, id: string): Promise<AdminServiceResult<any>> {
        try {
            const count = await prisma.internalService.count({ where: { categoryId: id } });
            if (count > 0) throw new Error('Cannot delete category with services');

            await prisma.serviceCategory.delete({ where: { id } });
            await this.logAction(ctx, 'DELETE_CATEGORY', `Deleted category ${id}`, id);
            return this.success({ id });
        } catch (error: any) {
            return this.error('CATEGORY_DELETE_FAILED', error.message, error);
        }
    }

    /**
     * Gets services for inspection (Curator).
     */
    async getServicesForCurator(_ctx: AdminContext): Promise<AdminServiceResult<any[]>> {
        try {
            const services = await prisma.internalService.findMany({
                include: {
                    providerMappings: { include: { provider: true, providerService: true } },
                },
                orderBy: [{ platform: 'asc' }, { category: 'asc' }, { rating: 'desc' }]
            });
            return this.success(services);
        } catch (error: any) {
            return this.error('CURATOR_FETCH_FAILED', error.message, error);
        }
    }

    /**
     * Creates a new internal service.
     */
    async createService(ctx: AdminContext, data: any): Promise<AdminServiceResult<any>> {
        return safeAdminExecute(ctx, 'CREATE_SERVICE', async () => {
            const price = data.pricePer1000 ? new Decimal(data.pricePer1000) : new Decimal(0);
            const serviceId = (data.id as string) || Math.floor(Math.random() * 10000).toString();

            const service = await prisma.internalService.create({
                data: {
                    id: serviceId,
                    slug: (data.slug as string) || (data.name as string)?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'service',
                    name: data.name as string,
                    description: data.description as string,
                    pricePer1000: price,
                    minQty: Number(data.minQty || 10),
                    maxQty: Number(data.maxQty || 100000),
                    type: (data.type as any) || 'REGULAR',
                    category: data.category as any,
                    platform: data.platform as any,
                    targetType: (data.targetType as string) || 'ALL',
                    allowedTargetTypes: Array.isArray(data.allowedTargetTypes) ? data.allowedTargetTypes : [],
                    isActive: data.isActive === 'true' || data.isActive === true,
                    priceUnit: 1000,
                    unitName: 'шт',
                    geo: 'Mixed',
                }
            });

            return service;
        }, data.id || 'NEW');
    }

    /**
     * Creates a manual service with initial mappings.
     */
    async createManualService(ctx: AdminContext, data: any): Promise<AdminServiceResult<any>> {
        try {
            const service = await prisma.internalService.create({
                data: {
                    id: data.id,
                    slug: data.id,
                    name: data.name,
                    description: data.description,
                    requirements: data.requirements,
                    pricePer1000: new Decimal(data.pricePer1000),
                    minQty: data.minQty,
                    maxQty: data.maxQty,
                    platform: data.platform,
                    category: data.category,
                    targetType: data.targetType,
                    allowedTargetTypes: data.allowedTargetTypes || [],
                    isActive: true,
                    geo: 'Mixed',
                    providerMappings: {
                        create: (data.mappings || []).map((m: any) => ({
                            providerId: m.providerId,
                            providerServiceId: m.providerServiceId,
                            priority: m.priority,
                            isActive: true,
                            projectId: null
                        }))
                    }
                }
            });

            await this.logAction(ctx, 'CREATE_MANUAL_SERVICE', `Created manual service ${data.name}`, service.id);
            return this.success(service);
        } catch (error: any) {
            return this.error('MANUAL_SERVICE_CREATE_FAILED', error.message, error);
        }
    }

    /**
     * Updates a manual service (alias for updateService).
     */
    async updateManualService(ctx: AdminContext, serviceId: string, data: any): Promise<AdminServiceResult<any>> {
        return this.updateService(ctx, serviceId, data);
    }

    /**
     * Gets provider services for import.
     */
    async getProviderServicesForImport(ctx: AdminContext, providerId?: string): Promise<AdminServiceResult<any[]>> {
        try {
            const services = await prisma.providerService.findMany({
                where: { isIgnored: false, ...(providerId ? { providerId } : {}) },
                include: { provider: { select: { name: true } } },
                orderBy: [{ providerId: 'asc' }, { name: 'asc' }]
            });
            return this.success(services);
        } catch (error: any) {
            return this.error('PROVIDER_SERVICES_FETCH_FAILED', error.message, error);
        }
    }

    /**
     * Performs a smart import from a provider.
     */
    async smartImportFromProvider(ctx: AdminContext, providerId: string, projectId: string, filters: { include?: string, exclude?: string }): Promise<AdminServiceResult<any>> {
        try {
            const { SmartAnalyzerService } = await import('@/services/providers/smart-analyzer.service');
            
            const providerServices = await prisma.providerService.findMany({
                where: { providerId, isIgnored: false }
            });

            const includeTerms = filters.include?.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) || [];
            const excludeTerms = filters.exclude?.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) || [];

            const filtered = providerServices.filter(s => {
                const name = s.name.toLowerCase();
                const matchesInclude = includeTerms.length === 0 || includeTerms.some(t => name.includes(t));
                const matchesExclude = excludeTerms.length > 0 && excludeTerms.some(t => name.includes(t));
                return matchesInclude && !matchesExclude;
            });

            if (filtered.length === 0) return this.success({ count: 0 });

            let count = 0;
            for (const ps of filtered) {
                const internalSvc = await SmartAnalyzerService.importSingle(providerId, ps.id);
                await SmartAnalyzerService.activateInProject(internalSvc.id, projectId);
                count++;
            }

            return this.success({ count });
        } catch (error: any) {
            return this.error('SMART_IMPORT_FAILED', error.message, error);
        }
    }

    /**
     * Updates an existing provider mapping (priority, active status).
     */
    async updateProviderMapping(ctx: AdminContext, mappingId: string, data: { priority?: number; isActive?: boolean }): Promise<AdminServiceResult<any>> {
        try {
            const mapping = await prisma.internalServiceMapping.update({
                where: { id: mappingId },
                data
            });
            await this.logAction(ctx, 'UPDATE_MAPPING', `Updated mapping ${mappingId}: ${JSON.stringify(data)}`, mappingId);
            return this.success(mapping);
        } catch (error: any) {
            return this.error('MAPPING_UPDATE_FAILED', error.message, error);
        }
    }

    /**
     * Synchronizes a single provider mapping.
     */
    async syncProviderMapping(ctx: AdminContext, mappingId: string): Promise<AdminServiceResult<any>> {
        try {
            const { PricingService } = await import('@/services/finance/pricing.service');
            const mapping = await prisma.internalServiceMapping.findUnique({
                where: { id: mappingId },
                select: { internalServiceId: true, projectId: true }
            });
            if (!mapping) throw new Error('Mapping not found');

            const res = await PricingService.syncInternalServicePrice(mapping.internalServiceId, mapping.projectId || undefined);
            await this.logAction(ctx, 'SYNC_MAPPING', `Synced mapping ${mappingId}`, mappingId);
            return this.success(res);
        } catch (error: any) {
            return this.error('MAPPING_SYNC_FAILED', error.message, error);
        }
    }

    /**
     * Creates a new provider mapping for an internal service.
     */
    async linkProviderService(ctx: AdminContext, internalServiceId: string, providerId: string, providerServiceId: string, projectId: string | null = null): Promise<AdminServiceResult<any>> {
        try {
            const existing = await prisma.internalServiceMapping.findFirst({
                where: { internalServiceId, providerId, projectId }
            });

            if (existing) throw new Error('Mapping already exists for this provider and project');

            const mapping = await prisma.internalServiceMapping.create({
                data: {
                    internalServiceId,
                    providerId,
                    providerServiceId,
                    projectId,
                    priority: 2, // Default to reserve
                    isActive: true
                }
            });

            await this.logAction(ctx, 'LINK_MAPPING', `Linked service ${internalServiceId} to provider ${providerId}`, internalServiceId);
            return this.success(mapping);
        } catch (error: any) {
            return this.error('MAPPING_CREATE_FAILED', error.message, error);
        }
    }

    /**
     * Repairs service categories by ensuring they exist for all used platforms/types.
     */
    async repairCategories(ctx: AdminContext, projectId: string | null): Promise<AdminServiceResult<any>> {
        try {
            const { SmartAnalyzerService } = await import('@/services/providers/smart-analyzer.service');
            const services = await prisma.internalService.findMany({
                where: projectId ? { projectOverrides: { some: { projectId } } } : {},
                select: { platform: true, category: true }
            });

            const uniquePairs = Array.from(new Set(services.map(s => `${s.platform}:${s.category}`)));
            let count = 0;

            for (const pair of uniquePairs) {
                const [platform, category] = pair.split(':');
                const cat = await SmartAnalyzerService.resolveCategory(prisma, platform as any, category as any, 'ALL', projectId);
                if (cat) count++;
            }

            return this.success({ count });
        } catch (error: any) {
            return this.error('REPAIR_CATEGORIES_FAILED', error.message, error);
        }
    }

    /**
     * Runs global service synchronization.
     */
    async syncAllServices(ctx: AdminContext): Promise<AdminServiceResult<any>> {
        try {
            const { ServiceSyncService } = await import('@/services/providers/sync.service');
            const { SmartSyncService } = await import('@/services/providers/smart-sync.service');
            
            await ServiceSyncService.syncAllServices();
            const res = await SmartSyncService.syncPricesAndMarkup();
            
            await this.logAction(ctx, 'SYNC_ALL_SERVICES', `Ran global synchronization`);
            return this.success(res);
        } catch (error: any) {
            return this.error('SYNC_ALL_FAILED', error.message, error);
        }
    }

    /**
     * Gets service statuses across authorized projects.
     */
    async getServiceProjectStatuses(ctx: AdminContext, serviceId: string): Promise<AdminServiceResult<any[]>> {
        try {
            const projects = await prisma.project.findMany({
                where: ctx.isGlobalAdmin ? {} : { id: { in: ctx.allowedProjects } },
                select: { id: true, name: true }
            });

            const overrides = await prisma.projectServiceOverride.findMany({
                where: {
                    internalServiceId: serviceId,
                    projectId: { in: projects.map(p => p.id) }
                },
                select: { projectId: true, isActive: true }
            });

            const statusMap = new Map(overrides.map(o => [o.projectId, o.isActive]));

            const data = projects.map(p => ({
                id: p.id,
                name: p.name,
                isActive: statusMap.get(p.id) || false
            }));

            return this.success(data);
        } catch (error: any) {
            return this.error('PROJECT_STATUS_FETCH_FAILED', error.message, error);
        }
    }

    /**
     * Gets health stats for services in the last 24h.
     */
    async getServicesHealthStats(_ctx: AdminContext): Promise<AdminServiceResult<any>> {
        try {
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const orders = await prisma.order.findMany({
                where: { createdAt: { gte: dayAgo } },
                select: { internalServiceId: true, status: true, totalPrice: true, costPrice: true, quantity: true }
            });

            const healthMap: Record<string, any> = {};
            orders.forEach(order => {
                const id = order.internalServiceId;
                if (!healthMap[id]) healthMap[id] = { success: 0, total: 0, profit: 0 };
                if (order.status === 'COMPLETED') healthMap[id].success += 1;
                if (order.status !== 'PENDING') healthMap[id].total += 1;
                if (order.status !== 'CANCELED') {
                    const cost = order.costPrice ? Number(order.costPrice) * (order.quantity / 1000) : 0;
                    healthMap[id].profit += Number(order.totalPrice) - cost;
                }
            });

            return this.success(healthMap);
        } catch (error: any) {
            return this.error('HEALTH_STATS_FAILED', error.message, error);
        }
    }

    /**
     * Bulk saves service overrides for multiple projects.
     */
    async saveServiceOverrides(ctx: AdminContext, serviceId: string, overrides: Record<string, any>): Promise<AdminServiceResult<void>> {
        try {
            for (const [projectId, data] of Object.entries(overrides)) {
                const price = data.customPrice ? new Decimal(data.customPrice.toString().replace(',', '.')) : null;
                await prisma.projectServiceOverride.upsert({
                    where: { projectId_internalServiceId: { projectId, internalServiceId: serviceId } },
                    update: { customPrice: price, isActive: data.isActive, customName: data.customName || null, customDescription: data.customDescription || null },
                    create: { projectId, internalServiceId: serviceId, customPrice: price, isActive: data.isActive, customName: data.customName || null, customDescription: data.customDescription || null }
                });
            }
            return this.success(undefined);
        } catch (error: any) {
            return this.error('OVERRIDES_SAVE_FAILED', error.message, error);
        }
    }

    /**
     * Mass links services in a category to a provider.
     */
    async massLinkServices(ctx: AdminContext, projectId: string | null, mappings: any[]): Promise<AdminServiceResult<number>> {
        try {
            await prisma.$transaction(async (tx) => {
                for (const m of mappings) {
                    await tx.internalServiceMapping.upsert({
                        where: { projectId_internalServiceId_providerId: { projectId: projectId as any, internalServiceId: m.internalServiceId, providerId: m.providerId } },
                        update: { providerServiceId: m.providerServiceId.toString(), isActive: true, priority: 1 },
                        create: { projectId, internalServiceId: m.internalServiceId, providerId: m.providerId, providerServiceId: m.providerServiceId.toString(), priority: 1, isActive: true }
                    });
                }
            });
            await this.logAction(ctx, 'MASS_LINK_SERVICES', `Mass linked ${mappings.length} services`, projectId || undefined);
            return this.success(mappings.length);
        } catch (error: any) {
            return this.error('MASS_LINK_FAILED', error.message, error);
        }
    }

    /**
     * Bulk moves services to a new category.
     */
    async bulkMoveServicesToCategory(ctx: AdminContext, serviceIds: string[], targetCategoryId: string, targetPlatform: string, targetCategoryEnum: string): Promise<AdminServiceResult<number>> {
        try {
            if (!ctx.isGlobalAdmin) throw new Error('Unauthorized');
            await prisma.internalService.updateMany({
                where: { id: { in: serviceIds } },
                data: { categoryId: targetCategoryId, platform: targetPlatform as any, category: targetCategoryEnum as any }
            });
            await this.logAction(ctx, 'BULK_MOVE_SERVICES', `Moved ${serviceIds.length} services to category ${targetCategoryId}`);
            return this.success(serviceIds.length);
        } catch (error: any) {
            return this.error('BULK_MOVE_FAILED', error.message, error);
        }
    }

    /**
     * Bulk toggles service status.
     */
    async bulkToggleServices(ctx: AdminContext, serviceIds: string[], isActive: boolean): Promise<AdminServiceResult<number>> {
        try {
            if (!ctx.isGlobalAdmin) throw new Error('Unauthorized');
            await prisma.internalService.updateMany({
                where: { id: { in: serviceIds } },
                data: { isActive }
            });
            await this.logAction(ctx, 'BULK_TOGGLE_SERVICES', `Set ${serviceIds.length} services to ${isActive ? 'active' : 'inactive'}`);
            return this.success(serviceIds.length);
        } catch (error: any) {
            return this.error('BULK_TOGGLE_FAILED', error.message, error);
        }
    }

    /**
     * Updates project service override.
     */
    async updateProjectServiceOverride(ctx: AdminContext, projectId: string, serviceId: string, data: any): Promise<AdminServiceResult<any>> {
        try {
            await prisma.projectServiceOverride.upsert({
                where: { projectId_internalServiceId: { projectId, internalServiceId: serviceId } },
                create: {
                    projectId,
                    internalServiceId: serviceId,
                    isActive: data.isActive,
                    customPrice: data.customPrice !== null ? data.customPrice : undefined,
                    markup: data.markup !== null ? data.markup : undefined
                },
                update: {
                    isActive: data.isActive,
                    customPrice: data.customPrice !== null ? data.customPrice : null,
                    markup: data.markup !== null ? data.markup : null
                }
            });
            return this.success({});
        } catch (error: any) {
            return this.error('OVERRIDE_UPDATE_FAILED', error.message, error);
        }
    }

    /**
     * Bulk updates service overrides for a project.
     */
    async bulkUpdateProjectOverrides(ctx: AdminContext, projectId: string, serviceIds: string[], data: any): Promise<AdminServiceResult<{ count: number }>> {
        try {
            await prisma.$transaction(
                serviceIds.map(serviceId =>
                    prisma.projectServiceOverride.upsert({
                        where: { projectId_internalServiceId: { projectId, internalServiceId: serviceId } },
                        create: {
                            projectId,
                            internalServiceId: serviceId,
                            isActive: data.isActive ?? true,
                            markup: data.markup !== undefined ? (data.markup ?? undefined) : undefined,
                            customPrice: data.customPrice !== undefined ? (data.customPrice ?? undefined) : undefined,
                        },
                        update: {
                            ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
                            ...(data.markup !== undefined ? { markup: data.markup } : {}),
                            ...(data.customPrice !== undefined ? { customPrice: data.customPrice } : {}),
                        }
                    })
                )
            );
            return this.success({ count: serviceIds.length });
        } catch (error: any) {
            return this.error('BULK_OVERRIDE_FAILED', error.message, error);
        }
    }

    /**
     * Maps a project service to a specific provider.
     */
    async mapProjectServiceToProvider(ctx: AdminContext, projectId: string, internalServiceId: string, providerId: string, providerServiceId: number): Promise<AdminServiceResult<any>> {
        try {
            await prisma.$transaction(async (tx) => {
                await tx.internalServiceMapping.updateMany({
                    where: { projectId, internalServiceId },
                    data: { isActive: false, priority: 0 }
                });

                const existing = await tx.internalServiceMapping.findFirst({
                    where: { projectId, internalServiceId, providerId }
                });

                if (existing) {
                    await tx.internalServiceMapping.update({
                        where: { id: existing.id },
                        data: {
                            providerServiceId: String(providerServiceId),
                            priority: 1,
                            isActive: true
                        }
                    });
                } else {
                    await tx.internalServiceMapping.create({
                        data: {
                            projectId,
                            internalServiceId,
                            providerServiceId: String(providerServiceId),
                            providerId,
                            priority: 1,
                            isActive: true
                        }
                    });
                }
            });
            return this.success({});
        } catch (error: any) {
            return this.error('PROJECT_MAPPING_FAILED', error.message, error);
        }
    }

    /**
     * Gets provider services with filtering.
     */
    async getProviderServices(ctx: AdminContext, filter: any): Promise<AdminServiceResult<any>> {
        try {
            const page = filter.page || 1;
            const limit = filter.limit || 50;
            const skip = (page - 1) * limit;

            const where: any = { mappings: { none: {} } };
            if (!filter.showIgnored) where.isIgnored = false;
            if (filter.search) {
                where.OR = [{ name: { contains: filter.search, mode: 'insensitive' } }];
                const num = Number(filter.search);
                if (!isNaN(num)) where.OR.push({ id: { equals: String(num) } });
            }
            if (filter.provider) where.provider = { name: filter.provider };
            if (filter.platform && filter.platform !== 'ALL') where.name = { contains: filter.platform, mode: 'insensitive' };
            
            if (filter.priceMin !== undefined || filter.priceMax !== undefined) {
                where.rawPrice = {};
                if (filter.priceMin !== undefined) where.rawPrice.gte = filter.priceMin;
                if (filter.priceMax !== undefined) where.rawPrice.lte = filter.priceMax;
            }

            const [items, total] = await Promise.all([
                prisma.providerService.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { rawPrice: 'asc' },
                    include: { provider: true }
                }),
                prisma.providerService.count({ where })
            ]);

            return this.success({ items, total, totalPages: Math.ceil(total / limit) });
        } catch (error: any) {
            return this.error('CURATOR_FETCH_FAILED', error.message, error);
        }
    }

    /**
     * Ignores a set of provider services.
     */
    async ignoreProviderServices(ctx: AdminContext, ids: string[], providerName: string): Promise<AdminServiceResult<any>> {
        try {
            await prisma.providerService.updateMany({
                where: { id: { in: ids }, provider: { name: providerName } },
                data: { isIgnored: true }
            });
            await this.logAction(ctx, 'IGNORE_SERVICES', `Ignored ${ids.length} services from ${providerName}`);
            return this.success({});
        } catch (error: any) {
            return this.error('CURATOR_IGNORE_FAILED', error.message, error);
        }
    }

    /**
     * Searches services for manual orders.
     */
    async searchServices(ctx: AdminContext, query: string): Promise<AdminServiceResult<any[]>> {
        try {
            const svcs = await prisma.internalService.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { id: { contains: query, mode: 'insensitive' } }
                    ],
                    isActive: true
                },
                take: 10
            });
            return this.success(svcs.map(s => ({ ...s, pricePer1000: Number(s.pricePer1000) })));
        } catch (error: any) {
            return this.error('SERVICE_SEARCH_FAILED', error.message, error);
        }
    }
}



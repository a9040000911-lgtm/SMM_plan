import { prisma } from '@/lib/prisma';
import { AdminServiceResult, AdminContext } from '@/services/types';
import { BaseAdminService } from './base-admin.service';
import { Decimal } from 'decimal.js';
import { CreateExpenseContract, CreatePromoCodeContract } from './contracts';

/**
 * Finance metrics for admin dashboard.
 */
export interface AdminFinanceMetrics {
    totalBalance: number;
    totalDeposits: number;
    totalExpenses: number;
    netProfit: number;
    period: 'all' | 'month' | 'today';
}

/**
 * Service for administrative financial operations.
 * Handles transactions, promocodes, expenses, and ledger entries.
 */
export class AdminFinanceService extends BaseAdminService {
    private static instance: AdminFinanceService;

    private constructor() {
        super('AdminFinance');
    }

    public static getInstance(): AdminFinanceService {
        if (!AdminFinanceService.instance) {
            AdminFinanceService.instance = new AdminFinanceService();
        }
        return AdminFinanceService.instance;
    }

    /**
     * Gets transactions with advanced filtering and pagination.
     */
    async getTransactionsPaged(ctx: AdminContext, params: {
        page: number;
        pageSize: number;
        search?: string;
        type?: string;
        status?: string;
        projectId?: string;
    }): Promise<AdminServiceResult<{ items: any[]; total: number }>> {
        try {
            const { page, pageSize, search, type, status, projectId } = params;
            const skip = (page - 1) * pageSize;

            const where: any = {};

            // Project isolation
            if (projectId && projectId !== 'all') {
                if (!ctx.isGlobalAdmin && !ctx.allowedProjects.includes(projectId)) {
                    throw new Error('Forbidden access to project');
                }
                where.projectId = projectId;
            } else if (!ctx.isGlobalAdmin) {
                where.projectId = { in: ctx.allowedProjects };
            }

            if (type && type !== 'ALL') where.type = type;
            if (status && status !== 'ALL') where.status = status;

            if (search) {
                const isNumeric = /^\d+$/.test(search);
                where.OR = [
                    { id: { contains: search, mode: 'insensitive' } },
                    { externalId: { contains: search, mode: 'insensitive' } },
                    { user: { username: { contains: search, mode: 'insensitive' } } },
                    { user: { email: { contains: search, mode: 'insensitive' } } },
                    isNumeric ? { user: { tgId: BigInt(search) } } : undefined,
                ].filter(Boolean);
            }

            const [items, total] = await Promise.all([
                prisma.transaction.findMany({
                    where,
                    skip,
                    take: pageSize,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: { select: { username: true, email: true, tgId: true } },
                        project: { select: { name: true } }
                    }
                }),
                prisma.transaction.count({ where })
            ]);

            return {
                success: true,
                data: {
                    items: items.map(tx => ({
                        ...tx,
                        amount: Number(tx.amount),
                        user: {
                            ...tx.user,
                            tgId: tx.user.tgId?.toString() || null
                        }
                    })),
                    total
                }
            };
        } catch (error: any) {
            return this.handleError(error, 'TRANSACTIONS_FETCH_FAILED');
        }
    }

    /**
     * Gets promocodes with project filtering.
     */
    async getPromoCodes(ctx: AdminContext, projectId?: string): Promise<AdminServiceResult<any[]>> {
        try {
            const where: any = {};
            if (projectId && projectId !== 'all') {
                if (!ctx.isGlobalAdmin && !ctx.allowedProjects.includes(projectId)) {
                    throw new Error('Forbidden access to project');
                }
                where.projectId = projectId;
            } else if (!ctx.isGlobalAdmin) {
                where.projectId = { in: ctx.allowedProjects };
            }

            const codes = await prisma.promoCode.findMany({
                where,
                orderBy: { isActive: 'desc' },
                include: { project: { select: { name: true } } }
            });

            return { success: true, data: codes };
        } catch (error: any) {
            return this.handleError(error, 'PROMO_FETCH_FAILED');
        }
    }

    /**
     * Creates a new promocode.
     */
    async createPromoCode(ctx: AdminContext, rawData: any): Promise<AdminServiceResult<any>> {
        try {
            const data = CreatePromoCodeContract.parse(rawData);
            
            if (!this.isAllowed(ctx, data.projectId)) {
                return this.error('FORBIDDEN', `Forbidden access to project: ${data.projectId}`);
            }

            const code = data.code;
            const existing = await prisma.promoCode.findFirst({
                where: { code, projectId: data.projectId }
            });

            if (existing) throw new Error(`Promo code ${code} already exists for this project`);

            const promo = await prisma.promoCode.create({
                data: {
                    code,
                    discountPercent: data.discountPercent,
                    description: data.description,
                    projectId: data.projectId,
                    isActive: true
                }
            });

            await this.logAction(ctx, 'CREATE_PROMOCODE', `Created promo code ${promo.code}`, data.projectId);
            return { success: true, data: promo };
        } catch (error: any) {
            return this.handleError(error, 'PROMO_CREATE_FAILED');
        }
    }

    /**
     * Toggles promocode status.
     */
    async togglePromoCode(ctx: AdminContext, promoId: string): Promise<AdminServiceResult<any>> {
        try {
            const promo = await prisma.promoCode.findUnique({ where: { id: promoId } });
            if (!promo) throw new Error('Promo code not found');

            await this.checkProjectAuth(ctx, promo.projectId);

            const updated = await prisma.promoCode.update({
                where: { id: promoId },
                data: { isActive: !promo.isActive }
            });

            await this.logAction(ctx, 'TOGGLE_PROMOCODE', `Promo code ${promo.code} set to ${updated.isActive ? 'Active' : 'Inactive'}`, promo.projectId);
            return { success: true, data: updated };
        } catch (error: any) {
            return this.handleError(error, 'PROMO_TOGGLE_FAILED');
        }
    }

    /**
     * Deletes or deactivates a promocode.
     */
    async deletePromoCode(ctx: AdminContext, promoId: string): Promise<AdminServiceResult<{ deleted: boolean }>> {
        try {
            const promo = await prisma.promoCode.findUnique({ where: { id: promoId } });
            if (!promo) throw new Error('Promo code not found');

            await this.checkProjectAuth(ctx, promo.projectId);

            const usage = await prisma.userPromo.count({ where: { promoCodeId: promoId } });

            if (usage > 0) {
                await prisma.promoCode.update({ where: { id: promoId }, data: { isActive: false } });
                await this.logAction(ctx, 'DEACTIVATE_PROMOCODE', `Deactivated used promo code ${promo.code}`, promo.projectId || undefined);
                return { success: true, data: { deleted: false } };
            }

            await prisma.promoCode.delete({ where: { id: promoId } });
            await this.logAction(ctx, 'DELETE_PROMOCODE', `Deleted unused promo code ${promo.code}`, promo.projectId || undefined);
            return { success: true, data: { deleted: true } };
        } catch (error: any) {
            return this.handleError(error, 'PROMO_DELETE_FAILED');
        }
    }

    /**
     * Gets business expenses data for accounting.
     */
    async getExpensesData(ctx: AdminContext, filters: {
        projectId?: string;
        category?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<AdminServiceResult<{ expenses: any[]; total: number }>> {
        try {
            const where: any = {};
            
            if (filters.projectId && filters.projectId !== 'all') {
                if (!ctx.isGlobalAdmin && !ctx.allowedProjects.includes(filters.projectId)) {
                    throw new Error('Forbidden access to project');
                }
                where.projectId = filters.projectId;
            } else if (!ctx.isGlobalAdmin) {
                where.projectId = { in: ctx.allowedProjects };
            }

            if (filters.category && filters.category !== 'ALL') where.category = filters.category;
            
            if (filters.startDate || filters.endDate) {
                where.date = {};
                if (filters.startDate) where.date.gte = new Date(filters.startDate);
                if (filters.endDate) where.date.lte = new Date(filters.endDate + 'T23:59:59.999Z');
            }

            const [expenses, totalAgg] = await Promise.all([
                prisma.businessExpense.findMany({
                    where,
                    orderBy: { date: 'desc' },
                    include: { project: { select: { name: true } } }
                }),
                prisma.businessExpense.aggregate({
                    where,
                    _sum: { amount: true }
                })
            ]);

            return {
                success: true,
                data: {
                    expenses: expenses.map(e => ({
                        ...e,
                        amount: e.amount.toNumber()
                    })),
                    total: totalAgg._sum.amount?.toNumber() || 0
                }
            };
        } catch (error: any) {
            return this.handleError(error, 'EXPENSES_FETCH_FAILED');
        }
    }

    /**
     * Creates a new business expense.
     */
    async createExpense(ctx: AdminContext, rawData: any): Promise<AdminServiceResult<any>> {
        try {
            const data = CreateExpenseContract.parse(rawData);

            if (!this.isAllowed(ctx, data.projectId)) {
                return this.error('FORBIDDEN', `Forbidden access to project: ${data.projectId}`);
            }

            if (!data.projectId && !ctx.isGlobalAdmin) {
                throw new Error('Unauthorized to create global expenses');
            }

            const expense = await prisma.businessExpense.create({
                data: {
                    category: data.category as any,
                    amount: new Decimal(data.amount),
                    description: data.description,
                    date: data.date,
                    projectId: data.projectId
                }
            });

            await this.logAction(ctx, 'CREATE_EXPENSE', `Created expense: ${data.description}`, data.projectId);
            return { success: true, data: expense };
        } catch (error: any) {
            return this.handleError(error, 'EXPENSE_CREATE_FAILED');
        }
    }

    /**
     * Deletes a business expense.
     */
    async deleteExpense(ctx: AdminContext, id: string): Promise<AdminServiceResult<any>> {
        try {
            const expense = await prisma.businessExpense.findUnique({ where: { id } });
            if (!expense) throw new Error('Expense not found');

            await this.checkProjectAuth(ctx, expense.projectId);

            await prisma.businessExpense.delete({ where: { id } });
            await this.logAction(ctx, 'DELETE_EXPENSE', `Deleted expense: ${id}`, expense.projectId || undefined);

            return { success: true, data: { id } };
        } catch (error: any) {
            return this.handleError(error, 'EXPENSE_DELETE_FAILED');
        }
    }

    /**
     * Gets P&L (Profit and Loss) summary.
     */
    async getProfitLossSummary(ctx: AdminContext, startDate: Date, endDate: Date): Promise<AdminServiceResult<any>> {
        try {
            const projectWhere: any = ctx.isGlobalAdmin ? {} : { projectId: { in: ctx.allowedProjects } };

            const [orders, expenses, deposits] = await Promise.all([
                prisma.order.findMany({
                    where: { 
                        ...projectWhere,
                        createdAt: { gte: startDate, lte: endDate }, 
                        status: 'COMPLETED' 
                    },
                    select: { totalPrice: true, costPrice: true }
                }),
                prisma.businessExpense.aggregate({
                    where: { 
                        ...projectWhere,
                        date: { gte: startDate, lte: endDate } 
                    },
                    _sum: { amount: true }
                }),
                prisma.transaction.aggregate({
                    where: {
                        ...projectWhere,
                        type: 'DEPOSIT',
                        status: 'COMPLETED',
                        createdAt: { gte: startDate, lte: endDate }
                    },
                    _sum: { amount: true }
                })
            ]);

            const revenue = orders.reduce((sum, o) => sum.plus(o.totalPrice), new Decimal(0));
            const cost = orders.reduce((sum, o) => sum.plus(o.costPrice || 0), new Decimal(0));
            const operationalExpenses = expenses._sum.amount || new Decimal(0);
            const totalDeposits = deposits._sum.amount || new Decimal(0);

            const grossProfit = revenue.minus(cost);
            const netProfit = grossProfit.minus(operationalExpenses);

            return {
                success: true,
                data: {
                    revenue: revenue.toNumber(),
                    cost: cost.toNumber(),
                    expenses: operationalExpenses.toNumber(),
                    grossProfit: grossProfit.toNumber(),
                    netProfit: netProfit.toNumber(),
                    totalDeposits: totalDeposits.toNumber(),
                    orderCount: orders.length
                }
            };
        } catch (error: any) {
            return this.handleError(error, 'PL_SUMMARY_FAILED');
        }
    }

    /**
     * Gets finance metrics for dashboard.
     */
    async getFinanceMetrics(ctx: AdminContext, period: 'all' | 'month' | 'today' = 'all'): Promise<AdminServiceResult<AdminFinanceMetrics>> {
        try {
            let dateFilter: any = {};
            const now = new Date();

            if (period === 'today') {
                const startOfDay = new Date(now.setHours(0, 0, 0, 0));
                dateFilter = { gte: startOfDay };
            } else if (period === 'month') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                dateFilter = { gte: startOfMonth };
            }

            // 1. Total User Balance (Liability)
            const userBalances = await prisma.user.aggregate({
                where: !ctx.isGlobalAdmin ? { projectId: { in: ctx.allowedProjects } } : {},
                _sum: { balance: true }
            });

            // 2. Total Income (Completed Deposits)
            const income = await prisma.transaction.aggregate({
                where: {
                    type: 'DEPOSIT',
                    status: 'COMPLETED',
                    ...(period !== 'all' ? { createdAt: dateFilter } : {}),
                    ...(!ctx.isGlobalAdmin ? { user: { projectId: { in: ctx.allowedProjects } } } : {})
                },
                _sum: { amount: true }
            });

            // 3. Cost of Goods Sold (COGS)
            const cogs = await prisma.order.aggregate({
                where: {
                    status: { not: 'CANCELED' },
                    costPrice: { not: null },
                    ...(period !== 'all' ? { createdAt: dateFilter } : {}),
                    ...(!ctx.isGlobalAdmin ? { projectId: { in: ctx.allowedProjects } } : {})
                },
                _sum: { costPrice: true }
            });

            // 4. Operating Expenses
            const opEx = await prisma.businessExpense.aggregate({
                where: {
                    ...(period !== 'all' ? { date: dateFilter } : {}),
                    ...(!ctx.isGlobalAdmin ? { projectId: { in: ctx.allowedProjects } } : {})
                },
                _sum: { amount: true }
            });

            const totalBalance = Number(userBalances._sum.balance || 0);
            const totalDeposits = Number(income._sum.amount || 0);
            const totalCOGS = Number(cogs._sum.costPrice || 0);
            const totalOpEx = Number(opEx._sum.amount || 0);
            const totalExpenses = totalCOGS + totalOpEx;
            const netProfit = totalDeposits - totalExpenses;

            return {
                success: true,
                data: {
                    totalBalance,
                    totalDeposits,
                    totalExpenses,
                    netProfit,
                    period
                }
            };
        } catch (error: any) {
            return this.handleError(error, 'ADMIN_FINANCE_FETCH_FAILED');
        }
    }

    /**
     * Gets transactions for CSV export.
     */
    async getTransactionsForExport(ctx: AdminContext, params: any): Promise<AdminServiceResult<any[]>> {
        try {
            const { search, type, status, minAmount, maxAmount, startDate, endDate } = params;
            const where: any = {};

            if (!ctx.isGlobalAdmin) {
                where.user = { projectId: { in: ctx.allowedProjects } };
            }

            if (type && type !== 'ALL') where.type = type;
            if (status && status !== 'ALL') where.status = status;
            if (minAmount || maxAmount) {
                where.amount = {};
                if (minAmount) where.amount.gte = parseFloat(minAmount);
                if (maxAmount) where.amount.lte = parseFloat(maxAmount);
            }
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) where.createdAt.gte = new Date(startDate);
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    where.createdAt.lte = end;
                }
            }
            if (search) {
                const isNumeric = /^\d+$/.test(search);
                where.OR = [
                    { id: { contains: search, mode: 'insensitive' } },
                    { externalId: { contains: search, mode: 'insensitive' } },
                    { user: { username: { contains: search, mode: 'insensitive' } } },
                    { user: { email: { contains: search, mode: 'insensitive' } } },
                    isNumeric ? { user: { tgId: BigInt(search) } } : undefined,
                ].filter(Boolean);
            }

            const txs = await prisma.transaction.findMany({
                where,
                include: { user: { select: { username: true, email: true, tgId: true } } },
                orderBy: { createdAt: 'desc' }
            });

            return this.success(txs);
        } catch (error: any) {
            return this.error('EXPORT_FETCH_FAILED', error.message, error);
        }
    }

    /**
     * Gets total expenses for a period.
     */
    async getExpensesTotal(ctx: AdminContext, startDate: string, endDate: string): Promise<AdminServiceResult<number>> {
        try {
            const where: any = {
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate + 'T23:59:59.999Z'),
                }
            };

            if (!ctx.isGlobalAdmin) {
                where.projectId = { in: ctx.allowedProjects };
            }

            const expenses = await prisma.businessExpense.aggregate({
                where,
                _sum: { amount: true }
            });

            return { success: true, data: expenses._sum.amount?.toNumber() || 0 };
        } catch (error: any) {
            return this.handleError(error, 'EXPENSES_TOTAL_FAILED');
        }
    }
}



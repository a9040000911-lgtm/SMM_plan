import { prisma } from "@/lib/prisma";
import { AdminContext, AdminServiceResult } from "@/services/types";
import { createLogger, LoggerService } from "@/lib/logger";
import { Prisma } from "@prisma/client";

/**
 * Base class for all modular Admin services.
 * Provides shared utilities for logging, authorization, and error handling.
 */
export abstract class BaseAdminService {
    protected logger: LoggerService;

    constructor(contextName?: string) {
        this.logger = createLogger(contextName || this.constructor.name);
    }

    /**
     * A helper to run logic within a Prisma transaction.
     * Automatically passes the transaction client to the callback.
     */
    protected async runTransactional<T>(
        fn: (tx: Prisma.TransactionClient) => Promise<T>
    ): Promise<T> {
        return await prisma.$transaction(fn);
    }

    /**
     * Improved access check that returns true/false instead of throwing.
     */
    protected isAllowed(ctx: AdminContext, projectId: string | null | undefined): boolean {
        if (!projectId) return true;
        if (ctx.isGlobalAdmin) return true;
        return ctx.allowedProjects.includes(projectId);
    }

    /**
     * Standardized error wrapper for service methods.
     */
    protected handleError<T>(error: any, code: string = 'INTERNAL_ERROR'): AdminServiceResult<T> {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`${code}: ${message}`, error);
        return {
            success: false,
            error: {
                code,
                message,
                details: error
            }
        };
    }

    /**
     * Standardized success wrapper.
     */
    protected success<T>(data: T, meta?: Record<string, any>): AdminServiceResult<T> {
        return {
            success: true,
            data,
            meta
        };
    }

    /**
     * Checks if the current admin has access to the specified project.
     * Throws an error if access is denied.
     */
    protected async checkProjectAuth(ctx: AdminContext, projectId: string | null | undefined): Promise<void> {
        if (!projectId) return; // Global access or not applicable
        if (ctx.isGlobalAdmin) return;
        
        if (!ctx.allowedProjects.includes(projectId)) {
            const errorMsg = `Unauthorized access to project: ${projectId}`;
            this.logger.warn(`${errorMsg} (User: ${ctx.userId})`);
            throw new Error(errorMsg);
        }
    }

    /**
     * Creates an administrative log entry.
     */
    protected async logAction(ctx: AdminContext, action: string, details: string, targetId: string | null = null) {
        try {
            await prisma.adminLog.create({
                data: {
                    adminId: ctx.userId,
                    action,
                    details,
                    targetId
                }
            });
            this.logger.info(`Action: ${action} | Admin: ${ctx.userId} | Target: ${targetId}`);
        } catch (error: any) {
            this.logger.error(`Failed to create admin log: ${action}`, error);
        }
    }

    // Aliases for legacy compatibility if needed
    protected error<T>(code: string, message: string, _error?: any): AdminServiceResult<T> {
        return this.handleError(new Error(message), code);
    }
}

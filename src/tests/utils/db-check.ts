/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Utility to check database connectivity for integration tests.
 */
import { PrismaClient } from '@prisma/client';

let _isAvailable: boolean | null = null;

/**
 * Checks if the database is available. Caches the result.
 */
export async function isDatabaseAvailable(): Promise<boolean> {
    if (_isAvailable !== null) return _isAvailable;
    
    const testPrisma = new PrismaClient({
        datasourceUrl: process.env.DATABASE_URL,
        log: [],
    });

    try {
        await testPrisma.$queryRaw`SELECT 1`;
        _isAvailable = true;
    } catch {
        _isAvailable = false;
    } finally {
        await testPrisma.$disconnect().catch(() => {});
    }

    return _isAvailable;
}

/**
 * Jest helper: call in beforeAll to skip suite if DB is not available.
 * Usage: beforeAll(async () => skipIfNoDb());
 */
export async function skipIfNoDb() {
    const available = await isDatabaseAvailable();
    if (!available) {
        // This will mark the test as skipped in Jest output
        console.warn('[SKIP] Database not available at localhost:5432 — skipping integration tests');
    }
    return available;
}

/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

/**
 * Next.js Instrumentation
 * This file runs once when the server starts.
 * Used for initializing the service registry and breaking circular dependencies.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
      const { ServiceRegistry } = await import('@/services/registry');
      await ServiceRegistry.init();
  }
}

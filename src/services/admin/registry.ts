import { AdminFinanceService } from './admin-finance.service';
import { AdminSupportService } from './admin-support.service';
import { AdminUserService } from './admin-user.service';
import { AdminOrderService } from './admin-order.service';
import { AdminManagementService } from './admin-management.service';
import { AdminServiceService } from './admin-service.service';

/**
 * Centralized registry for Admin Services.
 * Simplifies dependency management and testing.
 */
export class AdminServiceRegistry {
    /**
     * Finance domain services.
     */
    static get finance() {
        return AdminFinanceService.getInstance();
    }

    /**
     * Support and ticketing services.
     */
    static get support() {
        return AdminSupportService.getInstance();
    }

    /**
     * User management and loyalty services.
     */
    static get users() {
        return AdminUserService.getInstance();
    }

    /**
     * Order monitoring and recovery services.
     */
    static get orders() {
        return AdminOrderService.getInstance();
    }

    /**
     * Project management and configuration services.
     */
    static get management() {
        return AdminManagementService.getInstance();
    }

    /**
     * Service catalog and provider mapping services.
     */
    static get services() {
        return AdminServiceService.getInstance();
    }

    /**
     * Creates a mock version of the registry for testing.
     */
    static mock(overrides: Partial<Record<keyof typeof AdminServiceRegistry, any>> = {}) {
        const mockRegistry: any = {};
        const domains = ['finance', 'support', 'users', 'orders', 'management', 'services'];
        
        domains.forEach(domain => {
            mockRegistry[domain] = overrides[domain as keyof typeof AdminServiceRegistry] || {
                // Default mock implementation
            };
        });
        
        return mockRegistry;
    }
}

// Export a shorthand for cleaner usage in actions
export const AdminServices = AdminServiceRegistry;

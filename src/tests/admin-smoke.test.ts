import { AdminServices } from '../services/admin/registry';
import { AdminContext } from '../services/types';

describe('Admin Service Integration Smoke Tests', () => {
    const mockCtx: AdminContext = {
        userId: 'test-admin-id',
        isGlobalAdmin: true,
        allowedProjects: ['all'],
        role: 'ADMIN'
    };

    it('should be able to call searchUsers without crashing', async () => {
        const result = await AdminServices.users.searchUsers(mockCtx, 'test');
        expect(result.success).toBeDefined();
    });

    it('should be able to call searchServices without crashing', async () => {
        const result = await AdminServices.services.searchServices(mockCtx, 'test');
        expect(result.success).toBeDefined();
    });

    it('should be able to call getGlobalStats without crashing', async () => {
        const result = await AdminServices.management.getGlobalStats(mockCtx);
        expect(result.success).toBeDefined();
    });
});



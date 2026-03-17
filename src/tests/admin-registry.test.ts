import { AdminServiceRegistry, AdminServices } from '../services/admin/registry';
import { AdminUserService } from '../services/admin/admin-user.service';

describe('AdminServiceRegistry', () => {
    it('should return singleton instances of domain services', () => {
        const users1 = AdminServices.users;
        const users2 = AdminServices.users;
        
        expect(users1).toBeInstanceOf(AdminUserService);
        expect(users1).toBe(users2);
    });

    it('should return the correct service for each domain', () => {
        expect(AdminServices.users).toBeInstanceOf(AdminUserService);
        // Add checks for other domains if needed
    });

    it('should support mocking via AdminServiceRegistry.mock()', () => {
        const mockUsers = { searchUsers: jest.fn() };
        const registry = AdminServiceRegistry.mock({ users: mockUsers });

        expect(registry.users).toBe(mockUsers);
        expect(registry.users.searchUsers).toBeDefined();
    });

    it('should provide default empty objects for non-overridden domains in mock', () => {
        const registry = AdminServiceRegistry.mock({});
        expect(registry.finance).toBeDefined();
        expect(registry.support).toBeDefined();
    });
});

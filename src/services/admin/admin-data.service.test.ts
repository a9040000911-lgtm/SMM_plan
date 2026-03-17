/**
 * @jest-environment node
 */
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';
import { Decimal } from 'decimal.js';

// Hoisted variables for mocks
const mockInternalService = {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
};

const mockServiceCategory = {
    findUnique: jest.fn(),
};

const mockProjectServiceOverride = {
    upsert: jest.fn(),
};

const mockAdminLog = {
    create: jest.fn(),
};

const mockLogServiceChange = jest.fn();

jest.mock('@/lib/prisma', () => ({
    prisma: {
        internalService: mockInternalService,
        serviceCategory: mockServiceCategory,
        projectServiceOverride: mockProjectServiceOverride,
        adminLog: mockAdminLog,
        // Transaction mock that passes the prisma mock to the callback (handling both arrays and functions)
                settings: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn(), update: jest.fn(), create: jest.fn() },
        globalSetting: { findUnique: jest.fn(), findFirst: jest.fn(), upsert: jest.fn() },
        $transaction: jest.fn(async (arg) => {
            if (typeof arg === 'function') {
                return await arg({
                    internalService: mockInternalService,
                    serviceCategory: mockServiceCategory,
                    projectServiceOverride: mockProjectServiceOverride,
                    adminLog: mockAdminLog,
                    // Note: updateService calls this.logServiceChange(tx, ...) 
                    // which inside AdminDataService might expect tx to have certain properties
                    // but since AdminDataService methods are static, we need to be careful
                });
            }
            return Promise.all(arg);
        }),
    },
}));

jest.mock('@/services/finance/pricing.service', () => ({
    PricingService: {
        calculateRetailPrice: jest.fn().mockResolvedValue(100),
    },
}));

describe('AdminDataService', () => {
    let mockCtx: AdminContext;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCtx = {
            userId: 'test-admin-id',
            role: 'ADMIN',
            isGlobalAdmin: true,
            allowedProjects: ['project-1'],
        };
        // Setup default mocks
        mockServiceCategory.findUnique.mockResolvedValue(null);
        mockInternalService.findUnique.mockResolvedValue(null);
        
        // Mock private methods if needed (via prototype or type casting)
        (AdminDataService as any).logServiceChange = jest.fn().mockResolvedValue({});
        (AdminDataService as any).createAdminLog = jest.fn().mockResolvedValue({});
    });

    describe('checkProjectAuth', () => {
        test('should allow global admin for any project', async () => {
            mockCtx.isGlobalAdmin = true;
            // Should not throw
            await (AdminDataService as any).checkProjectAuth(mockCtx, 'other-project');
        });

        test('should allow project admin for their project', async () => {
            mockCtx.isGlobalAdmin = false;
            mockCtx.allowedProjects = ['project-1'];
            // Should not throw
            await (AdminDataService as any).checkProjectAuth(mockCtx, 'project-1');
        });

        test('should throw error for project admin accessing other project', async () => {
            mockCtx.isGlobalAdmin = false;
            mockCtx.allowedProjects = ['project-1'];
            await expect((AdminDataService as any).checkProjectAuth(mockCtx, 'project-2'))
                .rejects.toThrow('Unauthorized access to project: project-2');
        });
    });

    describe('createManualService', () => {
        test('should create a service successfully (Global Admin)', async () => {
            const serviceData = { id: 'test-service', name: 'Test Service', pricePer1000: 100 };
            mockInternalService.create.mockResolvedValue({ id: serviceData.id, name: serviceData.name });

            const result = await AdminDataService.createManualService(mockCtx, serviceData as any);

            expect(result.success).toBe(true);
            expect(mockInternalService.create).toHaveBeenCalled();
            expect((AdminDataService as any).createAdminLog).toHaveBeenCalled();
        });

        test('should return error if creation fails', async () => {
            mockInternalService.create.mockRejectedValue(new Error('DB Error'));
            const result = await AdminDataService.createManualService(mockCtx, { id: 'test-id', name: 'test', pricePer1000: 100 } as any);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error?.code).toBe('MANUAL_SERVICE_CREATE_FAILED');
            }
        });
    });

    describe('updateManualService', () => {
        test('should update a service successfully', async () => {
            const serviceId = 'test-id';
            const updateData = { name: 'Updated Name', pricePer1000: 120 };
            mockInternalService.findUnique.mockResolvedValue({ 
                id: serviceId,
                pricePer1000: new Decimal(100),
                markup: 10,
                lastProviderPrice: 90,
                category: 'Test',
                platform: 'Telegram'
            });
            mockInternalService.update.mockResolvedValue({ id: serviceId });

            const result = await AdminDataService.updateManualService(mockCtx, serviceId, updateData as any);

            expect(result.success).toBe(true);
        });

        test('should verify project auth when accessing a different project', async () => {
            const serviceId = 'test-id';
            const updateData = { name: 'Updated Name' };
            
            // Setup ctx for a non-global admin
            mockCtx.isGlobalAdmin = false;
            mockCtx.allowedProjects = ['project-1'];
            
            // Test accessing project-2
            const result = await AdminDataService.updateService(mockCtx, serviceId, updateData as any, 'project-2');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error?.message).toContain('Unauthorized access to project: project-2');
            }
        });
    });

    describe('upsertProjectOverride', () => {
        test('should upsert override successfully', async () => {
            const overrideData = { internalServiceId: 'sid', projectId: 'pid', customPrice: 150 };
            mockProjectServiceOverride.upsert.mockResolvedValue({});

            const result = await AdminDataService.upsertProjectOverride(mockCtx, overrideData as any);

            expect(result.success).toBe(true);
            expect(mockProjectServiceOverride.upsert).toHaveBeenCalled();
        });
    });
});

/**
 * @jest-environment node
 */
import { OrderLifecycleService } from './order-lifecycle.service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
    prisma: {
        order: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
        },
    },
}));

describe('Order Data Isolation (Security)', () => {
    const userA = 'user-abc';
    const userB = 'user-xyz';
    const orderOfA = { id: 101, userId: userA, internalServiceId: 'svc-1' };

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should prevent User B from accessing User A order by ID', async () => {
        (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await OrderLifecycleService.getOrderById(101, userB);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error?.code).toBe('ORDER_NOT_FOUND');
        }
        expect(prisma.order.findFirst).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 101, userId: userB }
        }));
    });

    test('should only return orders belonging to the requesting user', async () => {
        (prisma.order.findMany as jest.Mock).mockResolvedValue([orderOfA]);

        const result = await OrderLifecycleService.getUserOrders(userA);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toHaveLength(1);
            expect(result.data?.[0].userId).toBe(userA);
        }
        expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { userId: userA }
        }));
    });

    test('should handle database errors gracefully during fetch', async () => {
        (prisma.order.findMany as jest.Mock).mockRejectedValue(new Error('DB_DOWN'));

        const result = await OrderLifecycleService.getUserOrders(userA);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error?.code).toBe('ORDERS_FETCH_FAILED');
        }
    });
});

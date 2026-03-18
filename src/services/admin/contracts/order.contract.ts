import { z } from 'zod';

/**
 * Contract for updating order status and tracking.
 */
export const UpdateOrderStatusContract = z.object({
    orderId: z.number(),
    status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'ERROR', 'CANCELED', 'REFUNDED']),
    externalId: z.string().optional().nullable(),
    startCount: z.number().optional().nullable(),
    remains: z.number().optional().nullable(),
});

/**
 * Contract for batch order cancellation.
 */
export const BatchCancelOrdersContract = z.object({
    orderIds: z.array(z.number()),
    reason: z.string().optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusContract>;
export type BatchCancelOrdersInput = z.infer<typeof BatchCancelOrdersContract>;



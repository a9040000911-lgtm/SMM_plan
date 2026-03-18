/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { ServiceResult } from '../types';

export class SupportService {
    /**
     * Returns all tickets for a user with messages.
     */
    static async getUserTickets(userId: string): Promise<ServiceResult<any[]>> {
        try {
            const tickets = await prisma.supportTicket.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' }
                    }
                }
            });
            return { success: true, data: tickets };
        } catch (error: any) {
            return {
                success: false,
                error: { code: 'TICKETS_FETCH_FAILED', message: error.message }
            };
        }
    }
}



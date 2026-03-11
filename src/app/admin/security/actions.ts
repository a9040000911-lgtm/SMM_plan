'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { FinancialSecurityService } from '@/services/security/financial-security.service';
import { getAdminSession } from '@/utils/admin-session';

async function checkAuth() {
    const session = await getAdminSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }
}

export async function getSecurityRisksAction() {
    await checkAuth();
    try {
        const risks = await FinancialSecurityService.getSecurityRisks();
        return { success: true, risks };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

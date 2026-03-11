/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { IPaymentProvider, PaymentProviderType } from './payment-provider.interface';
import { YooKassaService } from './yookassa.service';
import { RobokassaService } from './robokassa.service';

/**
 * YooKassa Provider Adapter
 */
class YooKassaProvider implements IPaymentProvider {
    async createPayment(
        projectId: string,
        amount: number,
        transactionId: string,
        description: string,
        userEmail?: string
    ) {
        const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/result`;

        const result = await YooKassaService.createPayment(
            projectId,
            amount,
            transactionId,
            description,
            returnUrl,
            userEmail
        );

        return {
            id: result.id,
            status: result.status,
            confirmationUrl: result.confirmationUrl
        };
    }
}

/**
 * Robokassa Provider Adapter
 */
class RobokassaProvider implements IPaymentProvider {
    async createPayment(
        projectId: string,
        amount: number,
        transactionId: string,
        description: string,
        userEmail?: string
    ) {
        return await RobokassaService.createPayment(
            projectId,
            amount,
            transactionId,
            description,
            userEmail
        );
    }
}

/**
 * Factory for creating payment provider instances
 */
export class PaymentProviderFactory {
    static getProvider(providerType: PaymentProviderType): IPaymentProvider {
        switch (providerType.toUpperCase()) {
            case 'YOOKASSA':
                return new YooKassaProvider();

            case 'ROBOKASSA':
                return new RobokassaProvider();

            default:
                throw new Error(`Unknown payment provider: ${providerType}`);
        }
    }

    /**
     * Get provider from project settings
     */
    static async getProviderForProject(projectId: string): Promise<IPaymentProvider> {
        const { prisma } = await import('@/lib/prisma');

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { paymentSettings: true }
        });

        const settings = project?.paymentSettings as any;
        const providerType = settings?.provider || 'YOOKASSA';

        return this.getProvider(providerType as PaymentProviderType);
    }
}

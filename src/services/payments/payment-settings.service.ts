/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from "@/lib/prisma";
import { CryptoService } from "../core/crypto.service";

export type PaymentProviderType = 'YOOKASSA' | 'ROBOKASSA';

export interface YooKassaSettings {
    shopId: string;
    secretKey: string;
    mode: 'TEST' | 'PRODUCTION';
}

export interface RobokassaSettings {
    merchantLogin: string;
    password1: string;
    password2?: string;
    testPassword1?: string;
    testPassword2?: string;
    mode: 'TEST' | 'PRODUCTION';
}

export class PaymentSettingsService {
    /**
     * Gets credentials for a specific provider and project with inheritance logic:
     * 1. Project-specific settings (DB)
     * 2. Global settings (DB)
     * 3. Environment variables (Fallback)
     */
    static async getCredentials<T>(projectId: string, provider: PaymentProviderType): Promise<T> {
        // 1. Try Project-specific settings
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { paymentSettings: true }
        });

        // Project settings might be an encrypted string or a raw object
        let projectSettings = project?.paymentSettings as any;
        if (typeof projectSettings === 'string') {
            projectSettings = CryptoService.decryptJson(projectSettings);
        }
        
        if (provider === 'YOOKASSA') {
            return await this.getYooKassaCredentials(projectSettings) as T;
        } else {
            return await this.getRobokassaCredentials(projectSettings) as T;
        }
    }

    private static async getYooKassaCredentials(projectSettings: any): Promise<YooKassaSettings> {
        const mode = projectSettings?.mode || (await this.getGlobalMode()) || 'PRODUCTION';
        const yookassa = projectSettings?.yookassa || {};
        const useGlobal = !!yookassa.useGlobal;

        // 1. Project Override (if not forced to global)
        if (!useGlobal && (yookassa.shopId || yookassa.testShopId)) {
            const isTest = mode === 'TEST';
            const shopId = isTest ? (yookassa.testShopId || yookassa.shopId) : yookassa.shopId;
            const secretKey = isTest ? (yookassa.testSecretKey || yookassa.secretKey) : yookassa.secretKey;

            if (shopId && secretKey) {
                return {
                    shopId: CryptoService.decrypt(shopId),
                    secretKey: CryptoService.decrypt(secretKey),
                    mode: mode as any
                };
            }
        }

        // 2. Global DB Settings
        const globalSettings = await prisma.globalSetting.findMany({
            where: {
                key: { in: [
                    'GLOBAL_YOOKASSA_SHOP_ID', 
                    'GLOBAL_YOOKASSA_SECRET_KEY',
                    'GLOBAL_YOOKASSA_TEST_SHOP_ID',
                    'GLOBAL_YOOKASSA_TEST_SECRET_KEY'
                ] }
            }
        });

        const isTestGlobal = mode === 'TEST';
        const gShopId = isTestGlobal 
            ? globalSettings.find(s => s.key === 'GLOBAL_YOOKASSA_TEST_SHOP_ID')?.value || globalSettings.find(s => s.key === 'GLOBAL_YOOKASSA_SHOP_ID')?.value
            : globalSettings.find(s => s.key === 'GLOBAL_YOOKASSA_SHOP_ID')?.value;
            
        const gSecretKey = isTestGlobal
            ? globalSettings.find(s => s.key === 'GLOBAL_YOOKASSA_TEST_SECRET_KEY')?.value || globalSettings.find(s => s.key === 'GLOBAL_YOOKASSA_SECRET_KEY')?.value
            : globalSettings.find(s => s.key === 'GLOBAL_YOOKASSA_SECRET_KEY')?.value;

        if (gShopId && gSecretKey) {
            return {
                shopId: CryptoService.decrypt(gShopId),
                secretKey: CryptoService.decrypt(gSecretKey),
                mode: mode as any
            };
        }

        // 3. Fallback to Env
        return {
            shopId: mode === 'TEST' ? (process.env.YOOKASSA_TEST_SHOP_ID || process.env.YOOKASSA_SHOP_ID || '') : (process.env.YOOKASSA_SHOP_ID || ''),
            secretKey: mode === 'TEST' ? (process.env.YOOKASSA_TEST_SECRET_KEY || process.env.YOOKASSA_SECRET_KEY || '') : (process.env.YOOKASSA_SECRET_KEY || ''),
            mode: mode as any
        };
    }

    private static async getRobokassaCredentials(projectSettings: any): Promise<RobokassaSettings> {
        const mode = projectSettings?.mode || (await this.getGlobalMode()) || 'PRODUCTION';
        const robokassa = projectSettings?.robokassa || {};
        const useGlobal = !!robokassa.useGlobal;

        // helper to get val from global or env
        const getFallback = async (key: string, envKey: string) => {
            const global = await prisma.globalSetting.findUnique({ where: { key } });
            return global ? CryptoService.decrypt(global.value) : (process.env[envKey] || '');
        };

        if (!useGlobal && robokassa?.merchantLogin && (robokassa?.password1 || robokassa?.testPassword1)) {
            return {
                merchantLogin: CryptoService.decrypt(robokassa.merchantLogin),
                password1: CryptoService.decrypt(robokassa.password1),
                password2: CryptoService.decrypt(robokassa.password2),
                testPassword1: CryptoService.decrypt(robokassa.testPassword1),
                testPassword2: CryptoService.decrypt(robokassa.testPassword2),
                mode: mode as any
            };
        }

        // Global/Env fallback
        return {
            merchantLogin: await getFallback('GLOBAL_ROBOKASSA_MERCHANT_LOGIN', 'ROBOKASSA_MERCHANT_LOGIN'),
            password1: await getFallback('GLOBAL_ROBOKASSA_PASSWORD1', 'ROBOKASSA_PASSWORD1'),
            password2: await getFallback('GLOBAL_ROBOKASSA_PASSWORD2', 'ROBOKASSA_PASSWORD2'),
            testPassword1: await getFallback('GLOBAL_ROBOKASSA_TEST_PASSWORD1', 'ROBOKASSA_TEST_PASSWORD1'),
            testPassword2: await getFallback('GLOBAL_ROBOKASSA_TEST_PASSWORD2', 'ROBOKASSA_TEST_PASSWORD2'),
            mode: mode as any
        };
    }

    private static async getGlobalMode(): Promise<string | null> {
        const setting = await prisma.globalSetting.findUnique({ where: { key: 'GLOBAL_PAYMENT_MODE' } });
        return setting?.value || null;
    }
}

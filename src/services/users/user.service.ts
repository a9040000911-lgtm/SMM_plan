/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { User } from '@/generated/client';
import { ServiceResult } from '../types';
import crypto from 'crypto';
import { UserRepository } from '../repositories/user.repository';

export class UserService {
    /**
     * Gets user by email and project isolation
     */
    static async getUserByEmail(email: string, projectId: string | null): Promise<User | null> {
        return await UserRepository.findByEmail(email, projectId);
    }

    /**
     * Gets user by ID
     */
    static async getById(userId: string): Promise<User | null> {
        return await UserRepository.findById(userId);
    }

    /**
     * Generates a new API Key for the user
     */
    static async generateApiKey(userId: string): Promise<ServiceResult<string>> {
        try {
            const newKey = `smm_${crypto.randomBytes(24).toString('hex')}`;
            
            await UserRepository.update(userId, { apiKey: newKey });

            return { success: true, data: newKey };
        } catch (error: any) {
            return { 
                success: false, 
                error: { code: 'API_KEY_GEN_FAILED', message: error.message } 
            };
        }
    }

    /**
     * Revokes the API Key for the user
     */
    static async revokeApiKey(userId: string): Promise<ServiceResult<void>> {
        try {
            await UserRepository.update(userId, { apiKey: null });

            return { success: true, data: undefined };
        } catch (error: any) {
            return { 
                success: false, 
                error: { code: 'API_KEY_REVOKE_FAILED', message: error.message } 
            };
        }
    }

    /**
     * Gets API key info
     */
    static async getApiKeyInfo(userId: string): Promise<ServiceResult<{ hasApiKey: boolean; apiKey: string | null }>> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { apiKey: true }
            });

            if (!user) throw new Error('Пользователь не найден');

            return { 
                success: true, 
                data: { 
                    hasApiKey: !!user.apiKey, 
                    apiKey: user.apiKey 
                } 
            };
        } catch (error: any) {
            return { 
                success: false, 
                error: { code: 'API_KEY_INFO_FAILED', message: error.message } 
            };
        }
    }

    /**
     * Gets full user settings including project context
     */
    static async getUserSettings(userId: string, projectId: string): Promise<ServiceResult<any>> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) throw new Error('Пользователь не найден');

            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { botUsername: true }
            });

            return {
                success: true,
                data: {
                    ...user,
                    botUsername: project?.botUsername,
                    hasPassword: !!user.password
                }
            };
        } catch (error: any) {
            return {
                success: false,
                error: { code: 'USER_SETTINGS_FETCH_FAILED', message: error.message }
            };
        }
    }
}



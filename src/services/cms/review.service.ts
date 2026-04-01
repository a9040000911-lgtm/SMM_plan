/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { ServiceResult } from '../types';
import { toPlainObject } from '@/utils/serialization';

export interface CreateReviewParams {
    projectId: string;
    userId?: string;
    rating: number;
    text: string;
    userName?: string;
    isAnonymous?: boolean;
}

export class ReviewService {
    /**
     * Creates a new review, ensuring a guest user exists if no userId is provided.
     */
    static async createReview(params: CreateReviewParams): Promise<ServiceResult<any>> {
        try {
            let actualUserId = params.userId;

            if (!actualUserId) {
                // Handle guest user logic
                let guestUser = await prisma.user.findFirst({
                    where: { email: 'guest@smmplan.ru' }
                });

                if (!guestUser) {
                    guestUser = await prisma.user.create({
                        data: {
                            email: 'guest@smmplan.ru',
                            username: 'guest',
                            role: 'USER'
                        }
                    });
                }
                actualUserId = guestUser.id;
            }

            const review = await prisma.review.create({
                data: {
                    projectId: params.projectId as string, // Ensure it's treated as string for typical case
                    userId: actualUserId,
                    rating: Number(params.rating),
                    text: params.text,
                    userName: params.userName || null,
                    isAnonymous: !!params.isAnonymous,
                    status: 'PENDING',
                }
            });

            return { success: true, data: toPlainObject(review) };
        } catch (error: any) {
            console.error('[ReviewService] Create error:', error);
            return {
                success: false,
                error: { code: 'REVIEW_CREATE_FAILED', message: error.message }
            };
        }
    }

    /**
     * Fetches approved reviews for a project.
     * Delegated from CmsService for unified review logic.
     */
    static async getApproved(projectId: string | null, limit: number = 12): Promise<ServiceResult<any[]>> {
        try {
            const reviews = await prisma.review.findMany({
                where: {
                    projectId: projectId || undefined,
                    status: 'APPROVED'
                },
                orderBy: { createdAt: 'desc' },
                take: limit
            });
            return { success: true, data: toPlainObject(reviews) };
        } catch (error: any) {
            return {
                success: false,
                error: { code: 'REVIEWS_FETCH_FAILED', message: error.message }
            };
        }
    }
}

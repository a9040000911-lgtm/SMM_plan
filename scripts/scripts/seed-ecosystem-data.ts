
import { prisma } from '../src/lib/prisma';
import { Decimal } from 'decimal.js';
import {
    AchievementType,
    ChallengeType,
    OrderStatus,
    ReviewStatus,
    MessageSender
} from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🌟 Seeding "Vibrant Ecosystem" data (Final Fixed)...');

    const projects = await prisma.project.findMany();
    const mainProject = projects.find(p => p.slug === 'smmplan') || projects[0];
    const goldProject = projects.find(p => p.slug === 'smmgold') || projects[1];

    if (!mainProject) throw new Error('Main project not found');

    const admin = await prisma.user.findUnique({ where: { id: 'admin-user' } });
    if (!admin) throw new Error('Admin user not found');

    // 1. Achievements for Admin
    console.log('🏆 Adding achievements...');
    const achTypes = [
        AchievementType.FIRST_BLOOD,
        AchievementType.HOT_STREAK,
        AchievementType.BIG_SPENDER
    ];

    for (const type of achTypes) {
        await prisma.achievement.upsert({
            where: { userId_type: { userId: admin.id, type } },
            update: {},
            create: { userId: admin.id, type, unlockedAt: new Date() }
        });
    }

    // 2. Challenges
    console.log('🎯 Setting up challenges...');
    await prisma.challenge.create({
        data: {
            userId: admin.id,
            type: ChallengeType.TRIPLE_THREAT,
            progress: 2,
            target: 3,
            expiresAt: new Date(Date.now() + 86400000 * 7),
            completed: false
        }
    });

    // 3. Promo Codes
    console.log('🎟️ Creating promo codes...');
    const promoCodes = [
        { code: 'STARTUP', discountPercent: 15, isActive: true },
        { code: 'SMM2026', discountPercent: 20, isActive: true },
        { code: 'EXPIRED_SMM', discountPercent: 50, isActive: false }
    ];

    for (const pc of promoCodes) {
        await prisma.promoCode.upsert({
            where: {
                projectId_code: {
                    projectId: mainProject.id,
                    code: pc.code
                }
            },
            update: { isActive: pc.isActive, discountPercent: pc.discountPercent },
            create: {
                code: pc.code,
                discountPercent: pc.discountPercent,
                isActive: pc.isActive,
                projectId: mainProject.id
            }
        });
    }

    // 4. Reviews & NPS
    console.log('⭐ Generating social proof (Reviews & NPS)...');
    const reviewTexts = [
        'Отличный сервис, подписчики пришли быстро! Рекомендую.',
        'SMMPlan лучший на рынке. Живые лайки в ВК за копейки.',
        'В SMMgold цены выше, но качество реально топовое. Все премиум.',
        'Заказал просмотры на Твич, всё пришло вовремя. Спасибо!',
        'Поддержка ответила за 5 минут. Решили проблему с ссылкой.'
    ];

    const lastOrders = await prisma.order.findMany({ take: 10, orderBy: { createdAt: 'desc' } });

    for (let i = 0; i < reviewTexts.length; i++) {
        const order = lastOrders[i % lastOrders.length];

        // Check if review already exists for this order to avoid duplicates on retry
        const existingReview = await prisma.review.findFirst({ where: { orderId: order.id } });
        if (!existingReview) {
            await prisma.review.create({
                data: {
                    userId: admin.id,
                    projectId: order.projectId || mainProject.id,
                    orderId: order.id,
                    rating: 5,
                    text: reviewTexts[i],
                    status: ReviewStatus.APPROVED,
                    qualityScore: 'HIGH'
                }
            });
        }

        const existingNps = await prisma.nPSSurvey.findFirst({ where: { orderId: order.id } });
        if (!existingNps) {
            await (prisma as any).nPSSurvey.create({
                data: {
                    userId: admin.id,
                    projectId: order.projectId || mainProject.id,
                    orderId: order.id,
                    score: i % 2 === 0 ? 10 : 9,
                    comment: 'Всё круто!'
                }
            });
        }
    }

    // 5. News
    console.log('📰 Publishing news...');
    const newsItems = [
        {
            title: 'Масштабное обновление каталога ВК!',
            content: 'Добавлены услуги по накрутке прослушиваний музыки, клипов и видео. Теперь мы покрываем все потребности вашего паблика в ВКонтакте.',
            projectId: mainProject.id
        },
        {
            title: 'SMMgold: Премиум-сервис запущен',
            content: 'Новый бренд для тех, кто ценит максимальное качество и скорость. Лучшие тарифы для VIP-клиентов.',
            projectId: goldProject.id
        }
    ];

    for (const news of newsItems) {
        const existingNews = await prisma.news.findFirst({ where: { title: news.title, projectId: news.projectId } });
        if (!existingNews) {
            await prisma.news.create({ data: news });
        }
    }

    // 6. Churn Predictions (AI Simulation)
    console.log('🤖 Simulating AI Churn Predictions...');
    const processingOrders = await prisma.order.findMany({
        where: { status: OrderStatus.PROCESSING },
        take: 5
    });

    for (const order of processingOrders) {
        const existingPred = await prisma.churnPrediction.findFirst({ where: { orderId: order.id } });
        if (!existingPred) {
            await prisma.churnPrediction.create({
                data: {
                    orderId: order.id,
                    predictedChurn: new Decimal(15.5),
                    confidenceScore: new Decimal(0.85),
                    recommendedAction: 'Рекомендуется добавить 10% бонусных подписчиков для удержания.'
                }
            });
        }
    }

    // 7. Managed Channels
    console.log('📡 Adding managed channels...');
    await prisma.managedChannel.upsert({
        where: { projectId_chatId: { projectId: mainProject.id, chatId: BigInt(-100123456789) } },
        update: {},
        create: {
            projectId: mainProject.id,
            userId: admin.id,
            chatId: BigInt(-100123456789),
            title: 'SMM News Channel',
            username: 'smm_news_test',
            isActive: true
        }
    });

    console.log('\n✅ System fully enriched with "vibrant ecosystem" data!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

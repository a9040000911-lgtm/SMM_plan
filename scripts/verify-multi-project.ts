
import { prisma } from '../src/lib/prisma';
import { Decimal } from 'decimal.js';
import { Platform } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🔍 Final Verification: Multi-Project & Cross-Platform Consistency\n');

    const projects = await prisma.project.findMany({
        where: { slug: { in: ['smmplan', 'smmgold'] } }
    });

    const testServices = await prisma.internalService.findMany({
        where: {
            platform: { in: [Platform.TELEGRAM, Platform.TWITCH, Platform.VK] }
        },
        take: 5
    });

    console.log('| Проект | Услуга | Платформа | Базовая цена | Цена проекта | Наценка |');
    console.log('|--------|--------|-----------|--------------|--------------|---------|');

    for (const project of projects) {
        for (const service of testServices) {
            const override = await prisma.projectServiceOverride.findUnique({
                where: {
                    projectId_internalServiceId: {
                        projectId: project.id,
                        internalServiceId: service.id
                    }
                }
            });

            const projectPrice = override?.customPrice || service.pricePer1000;
            const markupPercent = projectPrice.div(service.pricePer1000).sub(1).mul(100).toFixed(0);

            console.log(`| ${project.name} | ${service.name} | ${service.platform} | ${service.pricePer1000} | ${projectPrice} | +${markupPercent}% |`);
        }
    }

    console.log('\n📊 Order Statistics:');
    for (const project of projects) {
        const count = await prisma.order.count({ where: { projectId: project.id } });
        const totalVolume = await prisma.order.aggregate({
            where: { projectId: project.id },
            _sum: { totalPrice: true }
        });
        console.log(`- ${project.name}: ${count} заказов, Оборот: ${totalVolume._sum.totalPrice?.toFixed(2) || 0} RUB`);
    }

    console.log('\n🏁 Verification finished!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // 1. Установим основной проект как smmplan.pro
    try {
        await prisma.project.update({
            where: { id: '9f296484-8300-4974-ba17-17e1fa62b82e' },
            data: {
                name: 'SMMplan Pro',
                domain: 'smmplan.pro'
            }
        });
        console.log('✅ Проект 9f296484... переименован в SMMplan Pro (домен: smmplan.pro)');
    } catch (e: any) {
        console.error('❌ Не удалось обновить проект:', e.message);
    }

    // 2. Создадим Mock Провайдера
    try {
        let mock = await prisma.provider.findFirst({
            where: { name: 'E2E_AUTO_PROVIDER' }
        });
        
        if (!mock) {
            mock = await prisma.provider.create({
                data: {
                    name: 'E2E_AUTO_PROVIDER',
                    apiUrl: 'https://smmplan.pro/api/mock-provider',
                    apiKey: 'TEST_API_KEY_123',
                    // Привязываем к главному проекту
                    project: { connect: { id: '9f296484-8300-4974-ba17-17e1fa62b82e' } },
                    isEnabled: true,
                    type: 'PERFECT_PANEL',
                    metadata: { type: 'mock', description: 'Локальный мок-провайдер' }
                }
            });
            console.log('✅ Создан Mock-провайдер E2E_AUTO_PROVIDER -> https://smmplan.pro/api/mock-provider');
        } else {
            // Обновим, чтобы URL был правильный
            await prisma.provider.update({
                where: { id: mock.id },
                data: {
                    apiUrl: 'https://smmplan.pro/api/mock-provider',
                    apiKey: 'TEST_API_KEY_123',
                    project: { connect: { id: '9f296484-8300-4974-ba17-17e1fa62b82e' } },
                }
            });
            console.log('✅ Обновлен Mock-провайдер E2E_AUTO_PROVIDER для домена smmplan.pro');
        }
    } catch (e: any) {
        console.error('❌ Не удалось создать Mock-провайдера:', e.message);
    }
}

main().finally(() => void prisma.$disconnect());

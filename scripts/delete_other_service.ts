import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Поиск бракованной услуги youtube_likes_...');
    
    try {
        const deleted = await prisma.internalService.delete({
            where: { id: 'youtube_likes_2fadceff-6b98-4a6b-b202-f1efeca8aeab' }
        });
        console.log(`Успешно удалена бракованная услуга: ${deleted.name}`);
    } catch (e: any) {
        console.log('Не удалось удалить основную услугу (возможно уже удалена):', e.message);
    }

    console.log('Очистка других услуг-паразитов OTHER...');
    try {
        const others = await prisma.internalService.deleteMany({
            where: { platform: 'OTHER' }
        });
        console.log(`Успешно удалено услуг OTHER: ${others.count}`);
    } catch (e: any) {
        console.log('Ошибка при удалении OTHER:', e.message);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

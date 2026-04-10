const { chromium } = require('playwright');
const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();

(async () => {
    console.log('🔄 Запуск восстановления привязок для 56 отключенных услуг...');
    const browser = await chromium.launch({ headless: true });
    
    try {
        console.log('🔑 Авторизация в Smmtoolbox...');
        const page = await browser.newPage();
        await page.goto('https://panel.smmtoolbox.ru/admin/login', { waitUntil: 'networkidle' });
        await page.fill('input[name="email"]', 'a.sokolov@smm');
        await page.fill('input[name="password"]', 'Ud5pgC-4uK');
        await page.click('button[type="submit"]');
        await page.waitForSelector('#page-header-user-dropdown', { timeout: 15000 });
        console.log('✅ Авторизация успешна!');

        // Получаем все 56 отключенных услуг, которые пострадали от бага фолбэка
        const brokenServices = await prisma.internalService.findMany({
            where: { isActive: false },
            include: { providerMappings: true }
        });
        
        console.log(`Найдено отключенных услуг: ${brokenServices.length}`);
        let fixedCount = 0;

        for (const svc of brokenServices) {
            // Исходный Smmtoolbox ID хранится в svc.id
            const url = `https://panel.smmtoolbox.ru/admin/services/${svc.id}?site_id=1`;
            
            try {
                await page.goto(url, { waitUntil: 'domcontentloaded' });
                
                // Ищем селект с провайдером
                const providerText = await page.evaluate(() => {
                    const el = document.querySelector('select[name="provider_service_id"] option:checked');
                    return el ? el.innerText : null;
                });
                
                if (!providerText) {
                    console.log(`[${svc.id}] ⚠️ Не найдено поле провайдера_service_id на странице`);
                    continue;
                }
                
                // Парсим: "5447 (146) | Подписчики - Быстрые" -> ищем "146"
                const match = providerText.match(/\((\d+)\)/);
                if (!match) {
                    console.log(`[${svc.id}] ⚠️ Не удалось извлечь ID из текста: ${providerText}`);
                    continue;
                }
                
                const apiExternalId = match[1];
                console.log(`[${svc.id}] Нашли оригинальный ID провайдера: ${apiExternalId} из текста "${providerText}"`);
                
                // Ищем ProviderService с таким externalId в нашей БД
                // Чтобы не перепутать с другим провайдером (146 может быть у разных), мы можем использовать
                // текущего провайдера, к которому эта услуга была криво привязана (зачастую провайдер верный, а вот service - первый попавшийся)
                const currentMapping = svc.providerMappings[0]; 
                if (!currentMapping) continue;
                
                const correctProviderService = await prisma.providerService.findFirst({
                    where: { 
                        externalId: apiExternalId, 
                        providerId: currentMapping.providerId 
                    }
                });
                
                if (!correctProviderService) {
                    console.log(`[${svc.id}] ❌ Не нашли ProviderService с externalId=${apiExternalId} для этого провайдера!`);
                    continue;
                }
                
                // Обновляем маппинг!
                await prisma.internalServiceMapping.update({
                    where: { id: currentMapping.id },
                    data: { providerServiceId: correctProviderService.id }
                });
                
                // Включаем обратно саму услугу!
                await prisma.internalService.update({
                    where: { id: svc.id },
                    data: { isActive: true }
                });
                
                fixedCount++;
                console.log(`[${svc.id}] ✅ Успешно перепривязано к ${correctProviderService.externalId} и включено!`);
                
            } catch (err) {
                console.log(`[${svc.id}] 💥 Ошибка навигации:`, err.message);
            }
        }
        
        console.log(`\n🎉 Готово! Восстановлено услуг: ${fixedCount}`);

    } catch (e) {
        console.error('❌ Глобальная ошибка:', e);
    } finally {
        await browser.close();
        await prisma.$disconnect();
    }
})();

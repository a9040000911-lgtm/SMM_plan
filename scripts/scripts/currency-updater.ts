
import { prisma } from '../src/lib/prisma';
import axios from 'axios';
import { Currency } from '@prisma/client';

async function main() {
    console.log('🌐 Обновление курсов валют (CBR API)...');

    try {
        const response = await axios.get('https://www.cbr-xml-daily.ru/daily_json.js');
        const data = response.data;
        const valute = data.Valute;

        // Маппинг валют из CBR в наш Enum Currency
        const rates = [
            { code: 'USD', val: valute.USD },
            { code: 'EUR', val: valute.EUR },
            { code: 'KZT', val: valute.KZT },
            { code: 'UAH', val: valute.UAH },
            { code: 'TRY', val: valute.TRY },
            { code: 'INR', val: valute.INR },
            { code: 'VND', val: valute.VND },
            { code: 'IDR', val: valute.IDR },
            { code: 'THB', val: valute.THB },
        ];

        for (const item of rates) {
            if (!item.val) {
                console.warn(`⚠️ Валюта ${item.code} не найдена в ответе CBR.`);
                continue;
            }

            const rateValue = item.val.Value / item.val.Nominal;

            await prisma.currencyRate.upsert({
                where: { code: item.code as Currency },
                update: { rate: rateValue, updatedAt: new Date() },
                create: { code: item.code as Currency, rate: rateValue, updatedAt: new Date() }
            });

            console.log(`✅ ${item.code}: ${rateValue.toFixed(4)} RUB (Номинал: ${item.val.Nominal})`);
        }

        console.log('✨ Курсы успешно обновлены.');
    } catch (error) {
        console.error('❌ Ошибка при обновлении курсов:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

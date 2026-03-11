
import { prisma } from '../src/lib/prisma';
import axios from 'axios';
import { Decimal } from 'decimal.js';

async function main() {
    console.log('--- STARTING CURRENCY SYNC ---');
    try {
        const response = await axios.get('https://www.cbr-xml-daily.ru/daily_json.js');
        const data = response.data;

        console.log(`Date: ${data.Date}, PreviousDate: ${data.PreviousDate}`);

        const valute = data.Valute;
        const usdRate = valute.USD.Value;
        const eurRate = valute.EUR.Value;
        const kztRate = valute.KZT.Value / valute.KZT.Nominal; // Rate usually for 100 units

        console.log(`USD: ${usdRate} RUB`);
        console.log(`EUR: ${eurRate} RUB`);
        console.log(`KZT: ${kztRate} RUB`);

        // Update USD
        await prisma.currencyRate.upsert({
            where: { code: 'USD' },
            update: { rate: new Decimal(usdRate) },
            create: { code: 'USD', rate: new Decimal(usdRate) }
        });

        // Update EUR
        await prisma.currencyRate.upsert({
            where: { code: 'EUR' },
            update: { rate: new Decimal(eurRate) },
            create: { code: 'EUR', rate: new Decimal(eurRate) }
        });

        // Update KZT
        await prisma.currencyRate.upsert({
            where: { code: 'KZT' },
            update: { rate: new Decimal(kztRate) },
            create: { code: 'KZT', rate: new Decimal(kztRate) }
        });

        // RUB is always 1
        await prisma.currencyRate.upsert({
            where: { code: 'RUB' },
            update: { rate: new Decimal(1) },
            create: { code: 'RUB', rate: new Decimal(1) }
        });

        console.log('Successfully updated currency rates.');
    } catch (error) {
        console.error('Failed to sync currency:', error);
    }
}

main().catch(console.error);

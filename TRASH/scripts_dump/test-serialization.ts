import { toPlainObject } from '../src/utils/serialization.ts';
import { Decimal } from 'decimal.js';

const testData = {
    id: 1,
    tgId: BigInt('1234567890123456789'),
    balance: new Decimal('1500.50'),
    nested: {
        price: new Decimal('0.005'),
        timestamp: new Date(),
        array: [new Decimal('1'), BigInt('999')]
    }
};

console.log('Original Data (Types):', {
    tgId: typeof testData.tgId,
    balance: testData.balance.constructor.name,
    nestedPrice: testData.nested.price.constructor.name,
    array0: testData.nested.array[0].constructor.name,
    array1: typeof testData.nested.array[1]
});

const serialized = toPlainObject(testData);

console.log('Serialized Data (Types/Values):', {
    tgId: typeof serialized.tgId,
    tgIdValue: serialized.tgId,
    balance: typeof serialized.balance,
    nestedPrice: typeof serialized.nested.price,
    array0: typeof serialized.nested.array[0],
    array1: typeof serialized.nested.array[1]
});

// Проверка
if (typeof serialized.tgId !== 'string') throw new Error('BigInt not serialized to string');
if (typeof serialized.balance !== 'number') throw new Error('Decimal not serialized to number');
if (typeof serialized.nested.price !== 'number') throw new Error('Nested Decimal not serialized to number');
if (typeof serialized.nested.array[0] !== 'number') throw new Error('Array Decimal not serialized to number');
if (typeof serialized.nested.array[1] !== 'string') throw new Error('Array BigInt not serialized to string');

console.log('SUCCESS: Serialization check passed!');

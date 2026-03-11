
import { PricingService } from '../src/services/finance/pricing.service';
import { prisma } from '../src/lib/prisma';
import { Decimal } from 'decimal.js';

async function main() {
    console.log('--- STARTING PRICING VERIFICATION ---');

    // 1. Setup Test Project (or use Main)
    const project = await prisma.project.findFirst();
    if (!project) throw new Error('No project found');
    console.log(`Using Project: ${project.name} (${project.id})`);

    // 2. Set Global Rule: +10%
    console.log('\n[Test 1] Setting Global Rule (+10%)...');
    await PricingService.upsertMarkupRule({
        markupPercent: 10,
        fixedMarkup: 0,
        minPrice: 0,
        // No provider/category = global
    }, project.id);

    let price = await PricingService.calculateRetailPrice(100, { projectId: project.id });
    console.log(`Input: 100, Rule: +10% -> Output: ${price} (Expected: 110)`);
    if (!price.equals(110)) console.error('FAILED Test 1');

    // 3. Set Category Rule: +50% for "VIEWS"
    console.log('\n[Test 2] Setting Category Rule (VIEWS +50%)...');
    await PricingService.upsertMarkupRule({
        category: 'VIEWS',
        markupPercent: 50,
        fixedMarkup: 0,
        minPrice: 0
    }, project.id);

    price = await PricingService.calculateRetailPrice(100, { projectId: project.id, category: 'VIEWS' });
    console.log(`Input: 100, Category: VIEWS -> Output: ${price} (Expected: 150)`);
    if (!price.equals(150)) console.error('FAILED Test 2');

    // Check non-matching category still uses global
    price = await PricingService.calculateRetailPrice(100, { projectId: project.id, category: 'LIKES' });
    console.log(`Input: 100, Category: LIKES -> Output: ${price} (Expected: 110 from Global)`);
    if (!price.equals(110)) console.error('FAILED Test 2 (Global Fallback)');

    // 4. Set Provider Rule: +100% for "TestProvider"
    console.log('\n[Test 3] Setting Provider Rule (TestProvider +100%)...');
    await PricingService.upsertMarkupRule({
        providerName: 'TestProvider',
        markupPercent: 100,
        fixedMarkup: 0,
        minPrice: 0
    }, project.id);

    price = await PricingService.calculateRetailPrice(100, { projectId: project.id, providerName: 'TestProvider' });
    console.log(`Input: 100, Provider: TestProvider -> Output: ${price} (Expected: 200)`);
    if (!price.equals(200)) console.error('FAILED Test 3');

    // 5. Specific Provider + Category (TestProvider + VIEWS): +200%
    console.log('\n[Test 4] Setting Specific Rule (TestProvider + VIEWS +200%)...');
    await PricingService.upsertMarkupRule({
        providerName: 'TestProvider',
        category: 'VIEWS',
        markupPercent: 200,
        fixedMarkup: 0,
        minPrice: 0
    }, project.id);

    price = await PricingService.calculateRetailPrice(100, { projectId: project.id, providerName: 'TestProvider', category: 'VIEWS' });
    console.log(`Input: 100, Provider: TestProvider, Category: VIEWS -> Output: ${price} (Expected: 300)`);
    if (!price.equals(300)) console.error('FAILED Test 4');

    console.log('\n--- VERIFICATION FINISHED ---');
}

main().catch(console.error);

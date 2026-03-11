
import { prisma } from '../src/lib/prisma';
import { AchievementService } from '../src/services/gamification/achievement.service';
import { LoyaltyService } from '../src/services/users/loyalty.service';
import { AchievementType } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🧪 Verifying Feature Isolation...');

    const smmplan = await prisma.project.findUnique({ where: { slug: 'smmplan' } });
    const smmgold = await prisma.project.findUnique({ where: { slug: 'smmgold' } });

    if (!smmplan || !smmgold) {
        console.error('Projects missing');
        return;
    }

    // 1. Create a dummy user for each project
    console.log('\n👤 Creating test users...');
    const planUser = await prisma.user.upsert({
        where: { projectId_email: { projectId: smmplan.id, email: 'test@smmplan.ru' } },
        update: {},
        create: { projectId: smmplan.id, email: 'test@smmplan.ru', role: 'USER' }
    });

    const goldUser = await prisma.user.upsert({
        where: { projectId_email: { projectId: smmgold.id, email: 'test@smmgold.ru' } },
        update: {},
        create: { projectId: smmgold.id, email: 'test@smmgold.ru', role: 'USER' }
    });

    // 2. Test Gamification (Achievements)
    console.log('\n🏆 Testing Gamification...');

    const planAchResult = await AchievementService.checkAndUnlock(planUser.id, AchievementType.FIRST_BLOOD);
    console.log(`- SMMPlan (Enabled): checkAndUnlock result = ${planAchResult} (Should be true if first time or false if already exists, but NOT blocked by flag)`);

    try {
        const goldAchResult = await AchievementService.checkAndUnlock(goldUser.id, AchievementType.FIRST_BLOOD);
        console.log(`- SMMgold (Disabled): checkAndUnlock result = ${goldAchResult} (Should be false because flag is OFF)`);
    } catch (e: any) {
        console.log(`- SMMgold (Disabled): Caught expected rejection or false: ${e.message}`);
    }

    // 3. Test Referral
    console.log('\n🔗 Testing Referral Rates...');

    const planRef = await LoyaltyService.getReferralPercent(planUser.id, smmplan.id);
    console.log(`- SMMPlan (Enabled): Referral Percent = ${planRef}%`);

    const goldRef = await LoyaltyService.getReferralPercent(goldUser.id, smmgold.id);
    console.log(`- SMMgold (Disabled): Referral Percent = ${goldRef}% (Should be 0%)`);

    console.log('\n🏁 Verification complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });

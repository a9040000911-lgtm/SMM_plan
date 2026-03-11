
import { prisma } from '../src/lib/prisma';
import * as dotenv from 'dotenv';
dotenv.config();

// Features list as strings to avoid import issues in seeding environments
const ProjectFeature = {
    GAMIFICATION: 'GAMIFICATION',
    LOYALTY: 'LOYALTY',
    REFERRAL: 'REFERRAL',
    NPS: 'NPS',
    REVIEWS: 'REVIEWS',
    NEWS: 'NEWS'
};

async function main() {
    console.log('🔌 Configuring Project Feature Flags (Universal)...');

    const smmplan = await prisma.project.findUnique({ where: { slug: 'smmplan' } });
    const smmgold = await prisma.project.findUnique({ where: { slug: 'smmgold' } });

    if (!smmplan || !smmgold) {
        console.error('❌ Projects not found. Run seed-projects-data.ts first.');
        return;
    }

    // SMMPlan: Full Featured
    const smmplanConfig = (smmplan.config as any) || {};
    smmplanConfig.features = {
        [ProjectFeature.GAMIFICATION]: true,
        [ProjectFeature.LOYALTY]: true,
        [ProjectFeature.REFERRAL]: true,
        [ProjectFeature.NPS]: true,
        [ProjectFeature.REVIEWS]: true,
        [ProjectFeature.NEWS]: true
    };

    await prisma.project.update({
        where: { id: smmplan.id },
        data: { config: smmplanConfig }
    });
    console.log('✅ SMMPlan: All features enabled.');

    // SMMgold: Limited (Gamification and Referrals DISABLED)
    const smmgoldConfig = (smmgold.config as any) || {};
    smmgoldConfig.features = {
        [ProjectFeature.GAMIFICATION]: false,
        [ProjectFeature.LOYALTY]: true,
        [ProjectFeature.REFERRAL]: false,
        [ProjectFeature.NPS]: false,
        [ProjectFeature.REVIEWS]: true,
        [ProjectFeature.NEWS]: true
    };

    await prisma.project.update({
        where: { id: smmgold.id },
        data: { config: smmgoldConfig }
    });
    console.log('✅ SMMgold: Gamification and Referrals DISABLED.');

    console.log('\n🏁 Feature flag configuration complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });

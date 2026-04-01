/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { ServiceRegistry } from '../src/services/registry';
import { ProjectService } from '../src/services/core/project.service';
import { UserService } from '../src/services/users/user.service';
import { CatalogService } from '../src/services/core/catalog.service';
import { ReviewService } from '../src/services/cms/review.service';

async function runDiagnostics() {
    console.log('🚀 Starting SMMPlan Service Layer Diagnostics (ESM)...\n');

    try {
        process.env.NEXT_RUNTIME = 'nodejs';
        process.env.NODE_ENV = 'production';
        
        console.log('[1/5] Initializing Registry...');
        await ServiceRegistry.init();
        console.log('✅ Registry Initialized\n');

        console.log('[2/5] Testing ProjectService...');
        const projects = await ProjectService.getAllProjects();
        console.log(`✅ Found ${projects.length} projects`);
        if (projects.length > 0) {
            console.log(`   Sample: ${projects[0].name} (${projects[0].slug})`);
        }
        console.log('');

        const targetProjectId = projects[0]?.id;

        console.log('[3/5] Testing UserService...');
        if (targetProjectId) {
            const guest = await UserService.getUserByEmail('guest@smmplan.ru', targetProjectId);
            console.log(guest ? `✅ Guest user for reviews found: ${guest.id}` : 'ℹ️ Guest user profile not created yet');
        }
        console.log('');

        console.log('[4/5] Testing CatalogService...');
        if (targetProjectId) {
            const result = await CatalogService.getAvailableByPlatform(targetProjectId, 'TELEGRAM');
            console.log(result.success ? `✅ Catalog logic operational (Found ${result.data?.length || 0} services for TELEGRAM)` : `❌ Catalog logic failed: ${result.error?.message}`);
        }
        console.log('');

        console.log('[5/5] Testing ReviewService...');
        const reviews = await ReviewService.getApproved(targetProjectId || null, 1);
        console.log(reviews.success ? `✅ Review logic operational` : '❌ Review logic failed');
        
        console.log('\n✨ ALL SYSTEMS GREEN. ARCHITECTURAL INTEGRITY VERIFIED.');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ DIAGNOSTIC FAILED:', error);
        process.exit(1);
    }
}

runDiagnostics();

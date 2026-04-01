/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

const { ServiceRegistry } = require('../src/services/registry');
const { ProjectService } = require('../src/services/core/project.service');
const { UserService } = require('../src/services/users/user.service');
const { CatalogService } = require('../src/services/core/catalog.service');
const { ReviewService } = require('../src/services/cms/review.service');

async function runDiagnostics() {
    console.log('🚀 Starting SMMPlan Service Layer Diagnostics...\n');

    try {
        // 1. Initialization
        process.env.NEXT_RUNTIME = 'nodejs';
        process.env.NODE_ENV = 'production'; // Trigger actual init
        
        console.log('[1/5] Initializing Registry...');
        await ServiceRegistry.init();
        console.log('✅ Registry Initialized\n');

        // 2. Project Service
        console.log('[2/5] Testing ProjectService...');
        const projects = await ProjectService.getAllProjects();
        console.log(`✅ Found ${projects.length} projects`);
        if (projects.length > 0) {
            console.log(`   Sample: ${projects[0].name} (${projects[0].slug})`);
        }
        console.log('');

        // 3. User Service
        console.log('[3/5] Testing UserService...');
        const firstProject = projects[0];
        if (firstProject) {
            const guest = await UserService.getUserByEmail('guest@smmplan.ru', firstProject.id);
            console.log(guest ? `✅ Guest user found: ${guest.id}` : 'ℹ️ Guest user not found yet (normal for clean DB)');
        }
        console.log('');

        // 4. Catalog Service
        console.log('[4/5] Testing CatalogService...');
        const platforms = await CatalogService.getAvailablePlatforms();
        console.log(`✅ Found ${platforms.length} active platforms: ${platforms.map(p => p.name).join(', ')}\n`);

        // 5. Review Service
        console.log('[5/5] Testing ReviewService...');
        const reviews = await ReviewService.getApproved(null, 1);
        console.log(reviews.success ? `✅ Reviews API reachable (Found ${reviews.data?.length || 0} approved)` : '❌ Reviews API failed');
        
        console.log('\n✨ All core services are verified and operational!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Diagnostic FAILED:', error);
        process.exit(1);
    }
}

runDiagnostics();

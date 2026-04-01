import { prisma } from "../src/lib/prisma";
import { AdminDataService } from "../src/services/admin/admin-data.service";

async function main() {
    const providerId = "3eaf1651-8f89-4a7b-a3f2-b30550aa8271";
    
    console.log("Fetching provider services for Vexboost...");
    const services = await prisma.providerService.findMany({
        where: { providerId },
        select: { id: true, providerId: true }
    });

    console.log(`Found ${services.length} services. Starting import...`);

    const mockCtx: any = {
        userId: "system",
        isGlobalAdmin: true,
        allowedProjects: [],
        logAction: async () => {} // Mocking internal logAction if needed by safeAdminExecute
    };

    const settings = {
        markupPercent: 200,
        // Default mappings will be handled by the service logic (SmartAnalyzer)
    };

    const result = await AdminDataService.importProviderServices(mockCtx, services, settings);

    if (result.success) {
        console.log(`Successfully imported ${result.data?.count} services.`);
    } else {
        console.error("Import failed:", result.error);
    }
}

main()
    .catch(err => {
        console.error("Fatal error:", err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());

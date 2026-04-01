/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Toaster } from "sonner";
import { TmaRedirect } from "@/components/client/TmaRedirect";
import { Header } from "@/components/stitch/layout/Header";
import { Footer } from "@/components/stitch/layout/Footer";
import { MobileAppNav } from "@/components/stitch/layout/MobileAppNav";
import { FloatingActionButtons } from "@/components/client/FloatingActionButtons";
import { StatsSection } from "@/components/stitch/sections/StatsSection";

import { getClientProjectId } from "@/utils/project-resolver";
import { ProjectService } from "@/services/core";

export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { CmsBridgeProvider } from "@/components/cms/CmsBridge";

import { CmsService } from "@/services/cms/cms.service";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
    let projectId: string | null = null;
    let cmsStrings: Record<string, string> = {};
    let enableBugReporter = process.env.NEXT_PUBLIC_ENABLE_BUG_REPORTER !== 'false';
    let enableReviews = process.env.NEXT_PUBLIC_ENABLE_REVIEWS !== 'false';

    try {
        projectId = await getClientProjectId();
        cmsStrings = await CmsService.getProjectStrings(projectId);

        if (projectId) {
            const project = await ProjectService.getById(projectId);
            if (project && project.config) {
                const config = project.config as any;
                if (config.enableBugReporter !== undefined) enableBugReporter = config.enableBugReporter;
                if (config.enableReviews !== undefined) enableReviews = config.enableReviews;
            }
        }
    } catch (e) {
        console.error('[ClientLayout] Fatal error in server-side data fetching:', e);
        // Continue with fallbacks (projectId=null, empty cmsStrings, default flags)
    }

    return (
        <Suspense fallback={null}>
            <CmsBridgeProvider>
                <TmaRedirect>
                    <div className="font-sans bg-white text-slate-900 antialiased selection:bg-blue-600/10 min-h-screen relative overflow-x-hidden">
                        <Toaster position="top-center" expand={false} richColors />
                        <Header />
                        <main className="min-h-screen pt-20 pb-20 md:pb-0 flex flex-col">
                            {children}
                        </main>
                        <FloatingActionButtons
                            enableBugReporter={enableBugReporter}
                            enableReviews={enableReviews}
                        />
                        <StatsSection />
                        <Footer cmsContent={cmsStrings} />
                        <MobileAppNav />
                    </div>
                </TmaRedirect>
            </CmsBridgeProvider>
        </Suspense>
    );
}



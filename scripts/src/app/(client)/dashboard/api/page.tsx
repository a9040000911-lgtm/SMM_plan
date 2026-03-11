/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getClientProjectId } from "@/utils/project-resolver";
import { ApiUI } from "@/components/stitch/dashboard/ApiUI";

export const dynamic = 'force-dynamic';
export const metadata = { title: "API Терминал — Разработчикам | Smmplan" };

async function getApiData() {
    const session = await auth();
    if (!session?.user?.email) redirect("/login");
    const projectId = await getClientProjectId();
    const user = await prisma.user.findFirst({
        where: { email: session.user.email, projectId },
        select: { apiKey: true }
    });
    if (!user) redirect("/login");
    return user.apiKey;
}

export default async function ApiDashboardPage() {
    const apiKey = await getApiData();

    return (
        <ApiUI initialApiKey={apiKey} />
    );
}

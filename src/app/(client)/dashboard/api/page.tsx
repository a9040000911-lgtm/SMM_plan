/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";

import { redirect } from "next/navigation";
import { ApiUI } from "@/components/stitch/dashboard/ApiUI";
import { UserService } from "@/services/users/user.service";
import { getClientProjectId } from "@/utils/project-resolver";

export const dynamic = 'force-dynamic';
export const metadata = { title: "API Терминал — Разработчикам | Smmplan" };

export default async function ApiDashboardPage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/login");
    
    const projectId = await getClientProjectId();
    const userResult = await UserService.getUserByEmail(session.user.email, projectId);
    if (!userResult) redirect("/login");

    const result = await UserService.getApiKeyInfo(userResult.id);

    if (!result.success) {
        return <div>Ошибка при загрузке API данных</div>;
    }

    return (
        <ApiUI initialApiKey={result.data.apiKey} />
    );
}



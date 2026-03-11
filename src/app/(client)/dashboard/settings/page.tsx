/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getClientProjectId } from '@/utils/project-resolver';
import { SettingsUI } from "@/components/stitch/dashboard/SettingsUI";

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Настройки — Безопасность и Личные данные | Smmplan' };

async function getUser() {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');
    const projectId = await getClientProjectId();
    const user = await prisma.user.findFirst({ where: { email: session.user.email, projectId } });
    if (!user) redirect('/login');

    // Add bot username for TG binding
    const project = projectId ? await prisma.project.findUnique({
        where: { id: projectId },
        select: { botUsername: true }
    }) : null;

    return {
        ...user,
        botUsername: project?.botUsername,
        hasPassword: !!user.password,
    };
}

export default async function SettingsPage() {
    const user = await getUser();

    return (
        <SettingsUI userData={JSON.parse(JSON.stringify(user))} />
    );
}

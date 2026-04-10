import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { SubscriptionService } from '@/services/finance/subscription.service';
import { PremiumUI } from '@/components/stitch/dashboard/PremiumUI';

export const dynamic = 'force-dynamic';

export default async function PremiumDashboardPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');
    const subscription = await SubscriptionService.getSubscriptionDetails(session.user.id);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
            <PremiumUI subscription={subscription} />
        </div>
    );
}



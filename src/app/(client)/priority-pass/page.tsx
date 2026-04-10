import { PriorityPassClient } from './priority-pass-client';
import { auth } from '@/auth';
import { SubscriptionService } from '@/services/finance/subscription.service';

export const metadata = {
    title: 'Priority Pass - Оптовый клуб | Smmplan',
    description: 'Получите доступ к закупочным ценам провайдеров и приоритетную техническую поддержку.'
};

export default async function PriorityPassPage() {
    const session = await auth();
    const isLoggedIn = !!session?.user?.id;
    
    let hasPass = false;
    if (isLoggedIn) {
        hasPass = await SubscriptionService.checkActiveSubscription(session!.user!.id!);
    }

    return (
        <PriorityPassClient isLoggedIn={isLoggedIn} hasPass={hasPass} />
    );
}

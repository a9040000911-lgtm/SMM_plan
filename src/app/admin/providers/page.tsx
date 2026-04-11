/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { ProvidersClientView } from '@/components/admin/providers/providers-client-view';
import { getProvidersAction, getFinancialStatsAction, getActiveProjectContext } from './actions';

export const dynamic = 'force-dynamic';

export default async function ProvidersPage() {
  const [providers, financials, ctx] = await Promise.all([
    getProvidersAction(),
    getFinancialStatsAction(),
    getActiveProjectContext()
  ]);

  return (
    <ProvidersClientView 
      initialProviders={providers} 
      initialFinancials={financials}
      initialActiveProjectId={ctx.activeProjectId} 
    />
  );
}

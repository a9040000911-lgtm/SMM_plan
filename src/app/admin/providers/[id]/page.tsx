/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ProviderEditForm } from '@/components/admin/providers/provider-edit-form';

export const dynamic = 'force-dynamic';

export default async function EditProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const provider = await prisma.provider.findUnique({
    where: { id },
  });

  if (!provider) {
    notFound();
  }

  return <ProviderEditForm provider={provider} />;
}

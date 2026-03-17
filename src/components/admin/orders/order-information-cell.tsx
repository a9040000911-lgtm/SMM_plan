'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { getActivityLabel } from '@/utils/order-utils';
import { CopyButton } from '@/components/admin/core/copy-button';
import { AdminOrder } from '@/types/admin';

interface OrderInformationCellProps {
    order: AdminOrder;
}

export function OrderInformationCell({ order }: OrderInformationCellProps) {
    const [showDetails, setShowDetails] = useState(false);

    const date = new Date(order.createdAt);
    const creationDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;

    // Find the relevant mapping for the providerName if available
    const mapping = order.internalService.providerMappings?.find(
        m => m.provider.name === order.providerName
    ) || order.internalService.providerMappings?.[0];

    const providerServiceId = mapping?.providerServiceId || '-';

    return (
        <div className="space-y-1 text-xs">
            <div className="flex gap-1.5">
                <span className="text-slate-500 whitespace-nowrap">Категория:</span>
                <Link
                    href={`/admin/orders?platform=${order.internalService.platform}`}
                    className="text-blue-600 hover:underline transition-colors"
                >
                    {order.internalService.platform}
                </Link>
            </div>

            <div className="flex gap-1.5">
                <span className="text-slate-500 whitespace-nowrap">Активность:</span>
                <Link
                    href={`/admin/orders?category=${order.internalService.category}`}
                    className="text-blue-600 hover:underline transition-colors"
                >
                    {getActivityLabel(order.internalService.category)}
                </Link>
            </div>

            <div className="flex gap-1.5">
                <span className="text-slate-500 whitespace-nowrap">Сервис:</span>
                <Link
                    href={`/admin/services/${order.internalServiceId}`}
                    className="text-blue-600 hover:underline transition-colors font-medium"
                >
                    {order.internalService.name}
                </Link>
            </div>

            <div className="flex gap-1.5 items-start">
                <span className="text-slate-500 whitespace-nowrap">Ссылка:</span>
                <div className="flex items-center gap-1.5 min-w-0">
                    <a
                        href={order.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all transition-colors truncate"
                    >
                        {order.link}
                    </a>
                    <CopyButton value={order.link} label="Ссылка" className="shrink-0" />
                </div>
            </div>

            <div className="flex gap-1.5 items-center">
                <span className="text-slate-500 whitespace-nowrap">Кол-во:</span>
                <span className="text-slate-700 font-bold">{order.quantity}</span>
                {order.isDripFeed && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase rounded border border-indigo-100 animate-pulse-subtle">
                        Drip-feed
                    </div>
                )}
            </div>

            {order.isDripFeed && (
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 space-y-1.5 my-2">
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-bold uppercase tracking-tight">Прогресс прогонов</span>
                        <span className="text-slate-900 font-black font-mono">{order.currentRun} / {order.runs}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${(order.currentRun / order.runs) * 100}%` }}
                        />
                    </div>
                    {order.nextRunAt && order.status !== 'COMPLETED' && order.status !== 'CANCELED' && (
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            Следующий запуск: {new Date(order.nextRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    )}
                </div>
            )}

            <div className="flex gap-1.5">
                <span className="text-slate-500 whitespace-nowrap">Дата создания:</span>
                <span className="text-slate-700">{creationDate}</span>
            </div>

            <div className="pt-2 border-t border-slate-100 mt-2">
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-blue-600 hover:underline focus:outline-none transition-colors"
                >
                    {showDetails ? 'Скрыть детали' : 'Показать детали'}
                </button>

                {showDetails && (
                    <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex gap-1.5">
                            <span className="text-slate-500 whitespace-nowrap">Провайдер:</span>
                            <span className="text-slate-700">
                                {order.providerName || '—'} {mapping && !providerServiceId.includes('-') ? `(#${providerServiceId})` : ''}
                            </span>
                        </div>
                        <div className="flex gap-1.5">
                            <span className="text-slate-500 whitespace-nowrap">ID заказа у провайдера:</span>
                            <span className="text-slate-700 font-mono text-[10px]">
                                {order.externalId || '-'}
                            </span>
                        </div>
                        <div className="flex gap-1.5 items-start">
                            <span className="text-slate-500 whitespace-nowrap">Комментарий провайдера:</span>
                            <span className="text-slate-700 italic">
                                {(() => {
                                    const raw = order.providerRawResponse;
                                    if (!raw) return order.comments || '-';
                                    const msg = raw?.lastProviderResponse?.error || raw?.error || raw?.message || raw?.status;
                                    return msg || order.comments || '-';
                                })()}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

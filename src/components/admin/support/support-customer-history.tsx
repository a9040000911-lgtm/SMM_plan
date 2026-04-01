import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatAmount } from '@/utils/formatter';
import { getOrderStatusColor, getOrderStatusLabel } from '@/utils/order-utils';
import { History, ExternalLink } from 'lucide-react';

export async function SupportCustomerHistory({ userId }: { userId: string }) {
    const orders = await prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { internalService: { select: { name: true } } }
    });

    if (orders.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm text-center">
                <History size={20} className="text-slate-300 mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase text-slate-400">Нет истории заказов</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700 font-black uppercase tracking-tighter text-xs">
                    <History size={16} className="text-slate-400" />
                    Последние заказы ({orders.length})
                </div>
            </div>
            
            <div className="divide-y divide-slate-100">
                {orders.map(order => (
                    <div key={order.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <Link href={`/admin/orders/${order.id}`} className="text-sm font-black text-slate-800 hover:text-blue-600 transition-colors flex items-center gap-1.5 group">
                                #{order.id}
                                <ExternalLink size={12} className="text-slate-300 group-hover:text-blue-500" />
                            </Link>
                            <div className="font-black text-slate-700 text-sm">
                                {formatAmount(order.totalPrice)} ₽
                            </div>
                        </div>
                        
                        <div className="text-[11px] text-slate-600 mb-2 truncate" title={order.internalService?.name || 'Неизвестная услуга'}>
                            {order.internalService?.name || 'Неизвестная услуга'}
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-400 uppercase">
                                {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                            <span 
                                className="px-2 py-0.5 rounded uppercase tracking-widest text-[9px]"
                                style={{
                                    backgroundColor: `${getOrderStatusColor(order.status as any)}15`,
                                    color: getOrderStatusColor(order.status as any)
                                }}
                            >
                                {getOrderStatusLabel(order.status as any)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            
            <Link 
                href={`/admin/orders?userId=${userId}`}
                className="block p-3 bg-slate-50 text-center text-xs font-black text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors uppercase tracking-widest border-t border-slate-100"
            >
                Смотреть все
            </Link>
        </div>
    );
}

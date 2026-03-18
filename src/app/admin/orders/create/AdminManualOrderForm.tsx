'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard, Button } from '@/components/admin/ui';
import {
    searchUsersAction,
    searchServicesAction,
    calculateOrderPriceAction,
    createManualOrderAction
} from '../actions';
import { Search, User, Package, Link as LinkIcon, Hash, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function AdminManualOrderForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [searchingServices, setSearchingServices] = useState(false);

    const [userQuery, setUserQuery] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    const [serviceQuery, setServiceQuery] = useState('');
    const [services, setServices] = useState<any[]>([]);
    const [selectedService, setSelectedService] = useState<any>(null);

    const [link, setLink] = useState('');
    const [quantity, setQuantity] = useState<number>(0);

    const [priceDetails, setPriceDetails] = useState<any>(null);
    const [calculatingPrice, setCalculatingPrice] = useState(false);

    // SEARCH USERS
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (userQuery.length >= 2) {
                setSearchingUsers(true);
                try {
                    const res = await searchUsersAction(userQuery);
                    setUsers(res);
                } catch (err) {
                    console.error(err);
                } finally {
                    setSearchingUsers(false);
                }
            } else {
                setUsers([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [userQuery]);

    // SEARCH SERVICES
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (serviceQuery.length >= 2) {
                setSearchingServices(true);
                try {
                    const res = await searchServicesAction(serviceQuery);
                    setServices(res);
                } catch (err) {
                    console.error(err);
                } finally {
                    setSearchingServices(false);
                }
            } else {
                setServices([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [serviceQuery]);

    // CALCULATE PRICE
    useEffect(() => {
        const updatePrice = async () => {
            if (selectedUser && selectedService && quantity >= (selectedService.minQty || 10)) {
                setCalculatingPrice(true);
                try {
                    const res = await calculateOrderPriceAction(selectedUser.id, selectedService.id, quantity);
                    setPriceDetails(res);
                } catch (err) {
                    console.error(err);
                } finally {
                    setCalculatingPrice(false);
                }
            } else {
                setPriceDetails(null);
            }
        };
        updatePrice();
    }, [selectedUser, selectedService, quantity]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !selectedService || !link || !quantity) {
            toast.error('Пожалуйста, заполните все поля');
            return;
        }

        setLoading(true);
        try {
            const res = await createManualOrderAction({
                userId: selectedUser.id,
                serviceId: selectedService.id,
                link,
                qty: quantity,
                projectId: selectedUser.projectId || null
            });

            if (res.success) {
                toast.success(`Заказ #${res.orderId} создан!`);
                router.push('/admin/orders');
            } else {
                toast.error('Ошибка при создании заказа');
            }
        } catch (error: any) {
            toast.error(error.message || 'Ошибка сервера');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* SECTION 1: USER SELECTION */}
                <AdminCard title="1. Выбор клиента" className="overflow-visible">
                    <div className="p-6 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                placeholder="Поиск по ID, Telegram ID, @username или Email..."
                                value={userQuery}
                                onChange={(e) => setUserQuery(e.target.value)}
                            />
                            {searchingUsers && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />}
                        </div>

                        {users.length > 0 && !selectedUser && (
                            <div className="bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto z-10">
                                {users.map((u) => (
                                    <button
                                        key={u.id}
                                        type="button"
                                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                                        onClick={() => {
                                            setSelectedUser(u);
                                            setUserQuery(`@${u.username || u.tgId || u.id}`);
                                            setUsers([]);
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">@{u.username || u.tgId || 'User'}</div>
                                                <div className="text-[10px] text-slate-400 font-medium">Balance: {u.balance}₽ • ID: {u.id.slice(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedUser && (
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-emerald-800 uppercase italic">Выбран клиент: @{selectedUser.username || selectedUser.tgId}</div>
                                        <div className="text-xs text-emerald-600 font-bold">Текущий баланс: {selectedUser.balance}₽</div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="text-xs font-black uppercase text-emerald-700 hover:text-rose-500 transition-colors"
                                    onClick={() => { setSelectedUser(null); setUserQuery(''); }}
                                >
                                    Сбросить
                                </button>
                            </div>
                        )}
                    </div>
                </AdminCard>

                {/* SECTION 2: SERVICE SELECTION */}
                <AdminCard title="2. Выбор услуги" className="overflow-visible">
                    <div className="p-6 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                placeholder="Поиск услуги по названию или ID..."
                                value={serviceQuery}
                                onChange={(e) => setServiceQuery(e.target.value)}
                            />
                            {searchingServices && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />}
                        </div>

                        {services.length > 0 && !selectedService && (
                            <div className="bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto z-10">
                                {services.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                                        onClick={() => {
                                            setSelectedService(s);
                                            setServiceQuery(s.name);
                                            setServices([]);
                                        }}
                                    >
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">{s.name}</div>
                                            <div className="text-[10px] text-slate-400 font-medium">Base: {s.pricePer1000}₽/1k • Min: {s.minQty} • ID: {s.id}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedService && (
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-blue-800 uppercase italic">{selectedService.name}</div>
                                        <div className="text-xs text-blue-600 font-bold">Лимиты: {selectedService.minQty} - {selectedService.maxQty} шт.</div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="text-xs font-black uppercase text-blue-700 hover:text-rose-500 transition-colors"
                                    onClick={() => { setSelectedService(null); setServiceQuery(''); }}
                                >
                                    Сбросить
                                </button>
                            </div>
                        )}
                    </div>
                </AdminCard>

                {/* SECTION 3: LINK AND QUANTITY */}
                <AdminCard title="3. Параметры заказа">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Ссылка</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                    placeholder="https://..."
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-rose-50 text-rose-500 text-[10px] font-bold px-2 py-1 rounded-lg border border-rose-100">
                                    <span className="w-1.5 h-1.5 rounded-md bg-rose-500 animate-pulse" />
                                    БЕЗ ВАЛИДАЦИИ
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Количество</label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input
                                    type="number"
                                    required
                                    min={selectedService?.minQty || 1}
                                    max={selectedService?.maxQty || 1000000}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-black"
                                    placeholder="0"
                                    value={quantity || ''}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                    </div>
                </AdminCard>

                {/* SUMMARY AND SUBMIT */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900 rounded-lg p-8 text-white shadow-2xl shadow-slate-900/20">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center">
                            <CreditCard className="w-7 h-7 text-blue-400" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Итоговая стоимость</div>
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black italic tracking-tighter">
                                    {calculatingPrice ? '...' : (priceDetails?.finalPrice || '0.00')}₽
                                </div>
                                {priceDetails?.discountPercent > 0 && (
                                    <div className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-400/10 border border-emerald-400/20">
                                        -{priceDetails.discountPercent}% OFF
                                    </div>
                                )}
                            </div>
                            {priceDetails && (
                                <div className="text-[10px] font-medium text-slate-500 mt-1">
                                    Базовая цена: {priceDetails.basePrice}₽ • Скидка: {priceDetails.discountAmount}₽
                                </div>
                            )}
                        </div>
                    </div>

                    <Button
                        disabled={loading || !selectedUser || !selectedService || !link || !quantity || quantity < (selectedService?.minQty || 0)}
                        size="lg"
                        className="w-full md:w-auto min-w-[240px]"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                ОФОРМЛЕНИЕ...
                            </span>
                        ) : (
                            'СОЗДАТЬ ЗАКАЗ ВРУЧНУЮ'
                        )}
                    </Button>
                </div>

            </form>
        </div>
    );
}



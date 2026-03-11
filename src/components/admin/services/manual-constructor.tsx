'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus, FolderPlus, Layers, Info, Trash2, Edit2,
    Globe, X, CheckCircle2,
    ChevronDown, Search, PackagePlus, Database, MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    deleteService
} from '@/app/admin/services/actions';
import { toast } from 'sonner';
import { CATEGORY_LABELS } from '@/services/providers/smart-analyzer.logic';
import { Platform, Category } from '@/generated/client';
import { ServiceEditorModal } from './service-editor-modal';
import { useDraggable, useDroppable, DndContext, useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { bulkMoveServicesToCategoryAction } from '@/app/admin/services/bulk-actions';

function DraggableService({ service, children }: { service: any, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: service.id,
        data: { service }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
        opacity: 0.8,
        scale: 1.05,
        cursor: 'grabbing'
    } : { cursor: 'grab' };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={isDragging ? 'opacity-50 relative z-50' : ''}>
            {children}
        </div>
    );
}

function DroppableGroup({ group, children }: { group: any, children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
        id: group.id,
        data: { group }
    });

    return (
        <div
            ref={setNodeRef}
            className={`transition-all duration-300 rounded-2xl border relative ${isOver ? 'bg-blue-50 border-blue-400 ring-4 ring-blue-500/20 shadow-xl scale-[1.01] z-10' : 'bg-white border-slate-100 shadow-sm'}`}
        >
            {children}
            {isOver && (
                <div className="absolute inset-0 bg-blue-500/5 rounded-2xl pointer-events-none flex items-center justify-center z-20">
                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-blue-600 font-black text-xs uppercase tracking-widest border border-blue-100 animate-in zoom-in duration-200">
                        Переместить в эту категорию
                    </div>
                </div>
            )}
        </div>
    );
}

interface ManualServiceConstructorProps {
    projectId: string;
    initialGroups: any[];
    providers: any[];
    allProviderServices: any[];
}

export function ManualServiceConstructor({
    projectId,
    initialGroups,
    providers,
    allProviderServices
}: ManualServiceConstructorProps) {
    const [groups, setGroups] = useState(initialGroups);
    const router = useRouter();
    const [isAddingGroup, setIsAddingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState<Platform>('TELEGRAM');
    const [selectedCategory, setSelectedCategory] = useState<Category>('SUBSCRIBERS');
    const [showGuide, setShowGuide] = useState(true);

    // Filters & View Settings
    const [filterPlatform, setFilterPlatform] = useState<Platform | 'ALL'>('ALL');
    const [filterCategory, setFilterCategory] = useState<Category | 'ALL'>('ALL');
    const [currency, setCurrency] = useState<'RUB' | 'USD'>('RUB');
    const [priceUnit, setPriceUnit] = useState<'ITEM' | '1000'>('1000');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    // Constants
    // Constants
    const [usdRate, setUsdRate] = useState(95);

    useEffect(() => {
        const fetchRate = async () => {
            try {
                const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                if (res.ok) {
                    const data = await res.json();
                    if (data.rates && data.rates.RUB) {
                        setUsdRate(data.rates.RUB);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch currency rate:', error);
            }
        };

        fetchRate();
    }, []);

    // State for Service Editing/Creation
    const [editingService, setEditingService] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const isGlobal = !projectId || projectId === 'all';

    const handleAddGroup = () => {
        if (!isGlobal) {
            toast.info('Категории являются глобальными. Для их создания перейдите в Главный Каталог.', {
                action: {
                    label: 'Перейти',
                    onClick: () => router.push('/admin/services')
                }
            });
            return;
        }
        toast.error('Для создания категории используйте Smart Import.');
    };

    const handleEditService = (_group: any, service: any) => {
        setEditingService(service);
        setIsModalOpen(true);
    };

    const handleCreateService = (_group: any) => {
        setEditingService(null);
        setIsModalOpen(true);
    };

    const handleModalSuccess = () => {
        setIsModalOpen(false);
        setEditingService(null);
        toast.success('Успешно сохранено');
        router.refresh();
        setTimeout(() => window.location.reload(), 1000);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Удалить эту услугу из базы?')) return;
        setIsDeleting(id);
        const res = await deleteService(id);
        setIsDeleting(null);
        if (res.success) {
            toast.success('Тариф удален');
            window.location.reload();
        } else {
            toast.error(res.error);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;

        if (!over) return;

        const serviceId = active.id;
        const targetGroupId = over.id;
        const targetGroup = groups.find(g => g.id === targetGroupId);

        if (!targetGroup) return;

        // Optimistic Update
        const sourceGroup = groups.find(g => g.internalServices.some((s: any) => s.id === serviceId));
        if (sourceGroup?.id === targetGroupId) return; // Same group

        const service = sourceGroup?.internalServices.find((s: any) => s.id === serviceId);
        if (!service) return;

        const newGroups = groups.map(g => {
            if (g.id === sourceGroup.id) {
                return { ...g, internalServices: g.internalServices.filter((s: any) => s.id !== serviceId) };
            }
            if (g.id === targetGroup.id) {
                return { ...g, internalServices: [...(g.internalServices || []), { ...service, categoryId: targetGroup.id }] };
            }
            return g;
        });
        setGroups(newGroups);

        toast.promise(
            bulkMoveServicesToCategoryAction([serviceId], targetGroup.id, targetGroup.platform, targetGroup.categoryType || targetGroup.category),
            {
                loading: 'Перемещаем...',
                success: 'Услуга перемещена',
                error: 'Ошибка перемещения'
            }
        );
    };

    const filteredGroups = groups.filter(g => {
        const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.internalServices?.some((s: any) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesPlatform = filterPlatform === 'ALL' || g.platform === filterPlatform;
        const matchesCategory = filterCategory === 'ALL' || g.category === filterCategory;

        return matchesSearch && matchesPlatform && matchesCategory;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredGroups.length / ITEMS_PER_PAGE);
    const paginatedGroups = filteredGroups.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const formatPrice = (pricePer1000: number) => {
        let price = pricePer1000;
        if (priceUnit === 'ITEM') {
            price = price / 1000;
        }
        if (currency === 'USD') {
            price = price / usdRate;
        }

        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: priceUnit === 'ITEM' ? 3 : 2,
            maximumFractionDigits: priceUnit === 'ITEM' ? 5 : 2
        }).format(price);
    };



    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
            {/* Header / Stats */}
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-blue-500 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Категории в базе</span>
                    <div className="flex items-end justify-between mt-2">
                        <span className="text-3xl font-black text-slate-800 tracking-tighter italic">{groups.length}</span>
                        <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Layers size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-emerald-500 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Активных тарифов</span>
                    <div className="flex items-end justify-between mt-2">
                        <span className="text-3xl font-black text-slate-800 tracking-tighter italic">
                            {groups.reduce((acc, g) => acc + (g.internalServices?.length || 0), 0)}
                        </span>
                        <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2 bg-slate-900 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group hover:bg-slate-800 transition-all flex items-center justify-between">
                    <div className="relative z-10">
                        <h3 className="text-white font-black italic text-2xl uppercase tracking-tighter">Ручной редактор</h3>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Создавайте и управляйте структурой каталога</p>
                    </div>
                    <button
                        onClick={() => {
                            if (!isGlobal) handleAddGroup();
                            else setIsAddingGroup(true);
                        }}
                        className="relative z-10 flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/20"
                    >
                        <FolderPlus size={18} />
                        Новая категория
                    </button>
                    {/* Decor */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[120px] rounded-full"></div>
                </div>
            </div>

            {/* Guide Block */}
            {showGuide && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-[2.5rem] p-10 relative overflow-hidden group">
                    <button
                        onClick={() => setShowGuide(false)}
                        className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-full transition-all"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
                        <div className="flex-1 space-y-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4 italic uppercase">
                                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                                        <Info size={24} />
                                    </div>
                                    Инструкция конструктора
                                </h3>
                                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-3 opacity-60">Как добавить новую услугу за 3 шага</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-8 rounded-[2rem] border border-blue-100/50 shadow-sm relative group hover:shadow-xl transition-all border-dashed">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-sm font-black text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">1</div>
                                    <h4 className="text-[11px] font-black uppercase text-slate-800 mb-2 tracking-widest">Создайте Категорию</h4>
                                    <p className="text-[11px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight">Нажмите <b>"Новая категория"</b>. Это контейнер для услуг.</p>
                                </div>
                                <div className="bg-white p-8 rounded-[2rem] border border-blue-100/50 shadow-sm relative group hover:shadow-xl transition-all border-dashed">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-sm font-black text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">2</div>
                                    <h4 className="text-[11px] font-black uppercase text-slate-800 mb-2 tracking-widest">Добавьте Тариф</h4>
                                    <p className="text-[11px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight">Внутри категории нажмите <b>"+ Новый тариф"</b>. Укажите имя и цену.</p>
                                </div>
                                <div className="bg-white p-8 rounded-[2rem] border border-blue-100/50 shadow-sm relative group hover:shadow-xl transition-all border-dashed">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-sm font-black text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">3</div>
                                    <h4 className="text-[11px] font-black uppercase text-slate-800 mb-2 tracking-widest">Привяжите API</h4>
                                    <p className="text-[11px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight">В редакторе выберите <b>Тариф Провайдера</b> для автоматизации.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative group flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                            placeholder="Поиск по названию категории или услуги..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <select
                            value={filterPlatform}
                            onChange={e => { setFilterPlatform(e.target.value as Platform | 'ALL'); setCurrentPage(1); }}
                            className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500 cursor-pointer appearance-none min-w-[160px]"
                        >
                            <option value="ALL">Все платформы</option>
                            {Object.keys(Platform).map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>

                        <select
                            value={filterCategory}
                            onChange={e => { setFilterCategory(e.target.value as Category | 'ALL'); setCurrentPage(1); }}
                            className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500 cursor-pointer appearance-none min-w-[200px]"
                        >
                            <option value="ALL">Все категории</option>
                            {Object.keys(CATEGORY_LABELS).map(c => (
                                <option key={c} value={c}>{CATEGORY_LABELS[c as Category] || c}</option>
                            ))}
                        </select>

                        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
                            <div className="flex bg-white rounded-xl shadow-sm p-1">
                                <button
                                    onClick={() => setCurrency('RUB')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${currency === 'RUB' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    RUB
                                </button>
                                <button
                                    onClick={() => setCurrency('USD')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${currency === 'USD' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    USD
                                </button>
                            </div>
                            <div className="flex bg-white rounded-xl shadow-sm p-1">
                                <button
                                    onClick={() => setPriceUnit('1000')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${priceUnit === '1000' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    за 1000
                                </button>
                                <button
                                    onClick={() => setPriceUnit('ITEM')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${priceUnit === 'ITEM' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    за 1 шт
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isAddingGroup && isGlobal && (
                <div className="p-10 bg-blue-50 text-blue-900 rounded-[2.5rem] border border-blue-100 shadow-xl animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-blue-100 text-blue-600">
                                <FolderPlus size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-xl uppercase tracking-tighter italic leading-none">Новая категория</h4>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mt-1">Создание мастер-раздела в каталоге</p>
                            </div>
                        </div>
                        <button onClick={() => setIsAddingGroup(false)} className="p-2 text-blue-300 hover:text-rose-500 hover:bg-white rounded-full transition-all">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] ml-2">Название</label>
                            <input
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                className="w-full px-6 py-4 bg-white border border-blue-100 rounded-2xl text-sm font-bold shadow-sm focus:ring-4 ring-blue-500/10 outline-none transition-all"
                                placeholder="Например: VK | Подписчики (Эконом)"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] ml-2">Платформа</label>
                            <select
                                value={selectedPlatform}
                                onChange={(e) => setSelectedPlatform(e.target.value as Platform)}
                                className="w-full px-6 py-4 bg-white border border-blue-100 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm focus:ring-4 ring-blue-500/10 outline-none transition-all cursor-pointer"
                            >
                                {['TELEGRAM', 'INSTAGRAM', 'VK', 'TIKTOK', 'YOUTUBE', 'OTHER'].map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] ml-2">Тип контента</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value as Category)}
                                className="w-full px-6 py-4 bg-white border border-blue-100 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm focus:ring-4 ring-blue-500/10 outline-none transition-all cursor-pointer"
                            >
                                {Object.keys(CATEGORY_LABELS).map(c => <option key={c} value={c}>{CATEGORY_LABELS[c as Category] || c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end mt-10 gap-4">
                        <button onClick={() => setIsAddingGroup(false)} className="px-8 py-4 text-blue-400 font-black text-[10px] uppercase tracking-widest hover:text-blue-600 hover:bg-white rounded-2xl transition-all">Отмена</button>
                        <button onClick={handleAddGroup} className="px-10 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/30 active:scale-95 transition-all">
                            Создать категорию
                        </button>
                    </div>
                </div>
            )}

            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <div className="space-y-8">
                    {paginatedGroups.map((group: any) => (
                        <DroppableGroup key={group.id} group={group}>
                            <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400">
                                        <Globe size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-black text-slate-800 uppercase italic tracking-tighter text-lg leading-none">
                                                {group.name}
                                            </h4>
                                            <span className="text-[10px] font-mono font-bold text-slate-300 bg-white px-2 py-0.5 rounded border border-slate-100">#{group.id.split('-')[0].toUpperCase()}</span>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-[9px] font-black uppercase bg-white text-blue-600 px-3 py-1 rounded-lg border border-blue-100 shadow-sm">{group.platform}</span>
                                            <span className="text-[9px] font-black uppercase bg-white text-slate-500 px-3 py-1 rounded-lg border border-slate-200 shadow-sm">{CATEGORY_LABELS[group.category as Category] || group.category}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleCreateService(group)}
                                        className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                                    >
                                        <Plus size={16} />
                                        Новый тариф
                                    </button>
                                    <button className="p-3 text-slate-300 hover:text-slate-600 transition-colors">
                                        <MoreVertical size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-50 bg-white">
                                {group.internalServices?.map((service: any) => (
                                    <DraggableService key={service.id} service={service}>
                                        <div className="p-6 px-10 hover:bg-slate-50/50 transition-all flex items-center justify-between group/row">
                                            <div className="flex items-center gap-6">
                                                <div className="hidden md:flex w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 items-center justify-center text-[10px] font-mono font-black text-slate-400 group-hover/row:border-blue-200 group-hover/row:text-blue-500 group-hover/row:bg-white transition-all">
                                                    #{service.id.slice(-4).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="font-black text-slate-800 text-base tracking-tight">{service.name}</div>
                                                        <div className={cn("w-2 h-2 rounded-full", service.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-200")} />
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                            <Database size={12} className="opacity-50" />
                                                            {service.providerMappings?.[0]?.provider?.name || 'Manual'}
                                                        </div>
                                                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-black italic">
                                                            {formatPrice(Number(service.pricePer1000))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3" onPointerDown={(e) => e.stopPropagation()}>
                                                <div className="hidden lg:flex flex-col items-end mr-8 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Лимиты (Min/Max)</span>
                                                    <span className="text-[11px] font-bold text-slate-500 mt-1">{service.minQty.toLocaleString()} — {service.maxQty.toLocaleString()}</span>
                                                </div>

                                                <button
                                                    onClick={() => handleEditService(group, service)}
                                                    className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm hover:shadow-lg transition-all active:scale-90"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(service.id)}
                                                    disabled={isDeleting === service.id}
                                                    className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-200 shadow-sm hover:shadow-lg transition-all active:scale-90 disabled:opacity-50"
                                                >
                                                    {isDeleting === service.id ? <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </DraggableService>
                                ))}
                                {(!group.internalServices || group.internalServices.length === 0) && (
                                    <div className="p-20 text-center bg-white">
                                        <div className="inline-flex p-6 bg-slate-50 rounded-full text-slate-200 mb-6 border border-slate-100 border-dashed">
                                            <PackagePlus size={48} />
                                        </div>
                                        <div className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] italic">В этой категории пока нет тарифов</div>
                                        <button
                                            onClick={() => handleCreateService(group)}
                                            className="mt-6 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                        >
                                            Создать первый тариф
                                        </button>
                                    </div>
                                )}
                            </div>
                        </DroppableGroup>
                    ))}
                </div>
            </DndContext>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm w-fit mx-auto">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 disabled:opacity-30 hover:bg-white hover:text-blue-600 transition-all shadow-sm"
                    >
                        <ChevronDown className="rotate-90" size={18} />
                    </button>
                    <div className="flex items-center gap-3 px-6 py-2 text-xs font-black text-slate-800 uppercase tracking-tighter italic">
                        <span>Страница {currentPage}</span>
                        <span className="text-slate-200">из</span>
                        <span>{totalPages}</span>
                    </div>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 disabled:opacity-30 hover:bg-white hover:text-blue-600 transition-all shadow-sm"
                    >
                        <ChevronDown className="-rotate-90" size={18} />
                    </button>
                </div>
            )}

            {/* MODAL FOR NEW/EDIT SERVICE */}
            <ServiceEditorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                service={editingService}
                providers={providers}
                allProviderServices={allProviderServices}
                categories={groups} // Pass all categories
                onSuccess={handleModalSuccess}
            />
        </div>
    );
}


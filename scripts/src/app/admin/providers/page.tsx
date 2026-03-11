'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useEffect, useState } from 'react';
import {
  RefreshCcw,
  Plus,
  Settings,
  Activity,
  CreditCard,
  Trash2,
  X,
  ExternalLink,
  Save,
  Loader2,
  TrendingUp,
  Clock,
  BrainCircuit,
  CalendarCheck,
  ShieldCheck,
  Globe,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { formatAmount } from '@/utils/formatter';
import { AdminProvider } from '@/types/admin';
import { AdminHeader } from '@/components/admin/core/admin-header';
import {
  getProvidersAction,
  syncAllProvidersAction,
  syncProviderAction,
  createProviderAction,
  updateProviderAction,
  deleteProviderAction,
  getFinancialStatsAction,
  addProviderPaymentAction,
  getActiveProjectContext
} from './actions';
import { MetadataBuilder } from '@/components/admin/providers/metadata-builder';
import { SecurityReportModal } from '@/components/admin/providers/security-report-modal'; // Add this import

export default function ProvidersPage() {
  const [providers, setProviders] = useState<AdminProvider[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingProviders, setSyncingProviders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<AdminProvider | null>(null);
  const [isEditModalOpen, setIsEditModal] = useState(false);
  const [isAddModalOpen, setIsAddModal] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    apiKey: '',
    apiUrl: '',
    isEnabled: true,
    balanceThreshold: '1000',
    type: 'universal',
    metadata: '{}',
    balanceCurrency: 'RUB',
    pricesCurrency: 'RUB'
  });

  // Financial stats state
  const [financials, setFinancials] = useState<{ forecasts: any[], revenue: any } | null>(null);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    providerId: '',
    providerName: '',
    amount: '',
    type: 'TOPUP',
    description: ''
  });

  // Security Report Modal State
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [securityProvider, setSecurityProvider] = useState<AdminProvider | null>(null);

  const fetchProviders = async () => {
    try {
      const [data, finData, ctx] = await Promise.all([
        getProvidersAction(),
        getFinancialStatsAction(),
        getActiveProjectContext()
      ]);
      setProviders(data);
      setFinancials(finData);
      setActiveProjectId(ctx.activeProjectId);
    } catch (_error) {
      console.error('Failed to fetch providers:', _error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const res = await syncAllProvidersAction();
      if (res.success) {
        alert('Синхронизация успешно выполнена!');
        fetchProviders();
      } else {
        alert('Ошибка: ' + res.error);
      }
    } catch (_error) {
      alert('Ошибка при синхронизации');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncProvider = async (id: string) => {
    setSyncingProviders(prev => new Set(prev).add(id));
    try {
      const res = await syncProviderAction(id);
      if (res.success) {
        // Optional: show toast
        fetchProviders();
      } else {
        alert('Ошибка: ' + res.error);
      }
    } catch (_error) {
      alert('Ошибка при синхронизации');
    } finally {
      setSyncingProviders(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let res: any;
      const threshold = parseFloat(formData.balanceThreshold) || 1000;
      if (formData.id) {
        res = await updateProviderAction(formData.id, {
          name: formData.name,
          type: formData.type || 'universal',
          apiKey: formData.apiKey,
          apiUrl: formData.apiUrl,
          isEnabled: formData.isEnabled,
          balanceThreshold: threshold,
          metadata: JSON.parse(formData.metadata || '{}')
        });
      } else {
        res = await createProviderAction({
          name: formData.name,
          type: formData.type || 'universal',
          apiKey: formData.apiKey,
          apiUrl: formData.apiUrl,
          isEnabled: formData.isEnabled,
          balanceThreshold: threshold,
          metadata: JSON.parse(formData.metadata || '{}')
        });
      }

      if (res.success) {
        setIsEditModal(false);
        setIsAddModal(false);
        fetchProviders();
      } else {
        alert('Ошибка: ' + ((res as any).error || 'Неизвестная ошибка'));
      }
    } catch (_error) {
      alert('Ошибка сети или сервера');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого провайдера? Все привязанные услуги останутся, но не смогут синхронизироваться.')) return;
    try {
      const res = await deleteProviderAction(id);
      if (res.success) {
        fetchProviders();
      } else {
        alert('Ошибка при удалении: ' + res.error);
      }
    } catch (_error: any) {
      alert('Ошибка при удалении: ' + (_error.message || 'Неизвестная ошибка'));
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await addProviderPaymentAction({
        providerId: paymentData.providerId,
        amount: parseFloat(paymentData.amount),
        type: paymentData.type as any,
        description: paymentData.description
      });
      if (res.success) {
        setIsPaymentModalOpen(false);
        alert('Пополнение записано!');
        fetchProviders(); // Refresh balances
      } else {
        alert('Ошибка: ' + (res as any).error);
      }
    } catch (_e) {
      alert('Ошибка сервера');
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (p: AdminProvider) => {
    setFormData({
      id: p.id,
      name: p.name,
      apiKey: p.apiKey,
      apiUrl: p.apiUrl,
      isEnabled: p.isEnabled,
      balanceThreshold: p.balanceThreshold.toString(),
      type: p.type || 'universal',
      metadata: JSON.stringify(p.metadata || {}, null, 2),
      balanceCurrency: p.balanceCurrency || 'RUB',
      pricesCurrency: p.pricesCurrency || 'RUB'
    });
    setIsEditModal(true);
  };

  const openAdd = () => {
    setFormData({ id: '', name: '', apiKey: '', apiUrl: '', isEnabled: true, balanceThreshold: '1000', type: 'universal', metadata: '{}', balanceCurrency: 'RUB', pricesCurrency: 'RUB' });
    setIsAddModal(true);
  };

  const openDetails = (p: AdminProvider) => {
    setSelectedProvider(p);
    setIsDetailsModal(true);
  };

  const openPaymentModal = (p: AdminProvider) => {
    setPaymentData({
      providerId: p.id,
      providerName: p.name,
      amount: '',
      type: 'TOPUP',
      description: ''
    });
    setIsPaymentModalOpen(true);
  };

  const openSecurityModal = (p: AdminProvider) => {
    setSecurityProvider(p);
    setIsSecurityModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-slate-300" size={32} />
      </div>
    );
  }

  // Determine mode from active project ID
  const isGlobalMode = activeProjectId === 'all' || activeProjectId === null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminHeader
        title={isGlobalMode ? 'API Провайдеры (Глобально)' : 'Провайдеры проекта'}
        subtitle={isGlobalMode
          ? 'Управление мастер-ключами и общими кошельками'
          : 'Проектные переопределения и локальные провайдеры'}
        rightElement={
          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
            >
              {isSyncing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCcw size={16} />}
              Синхронизировать всё
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-900/20"
            >
              <Plus size={16} />
              Добавить провайдера
            </button>
          </div>
        }
      />

      {financials && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1 flex items-center">
                    Выручка (Текущий месяц)
                  </div>
                  <div className="text-3xl font-black text-slate-800">{formatAmount(financials.revenue.current)}₽</div>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden group text-white">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1 flex items-center">
                    Прогноз к 30 числу
                  </div>
                  <div className="text-3xl font-black text-blue-400">~{formatAmount(financials.revenue.projected)}₽</div>
                </div>
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl">
                  <Clock size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Анализ счетов провайдеров</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Обучено на дельтах расхода</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                    <th className="px-6 py-4">Провайдер</th>
                    <th className="px-6 py-4">Баланс</th>
                    <th className="px-6 py-4">API Health / Latency</th>
                    <th className="px-6 py-4">Скорость (Avg)</th>
                    <th className="px-6 py-4">Дата обнуления</th>
                    <th className="px-6 py-4">Точность</th>
                    <th className="px-6 py-4 text-center">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {financials.forecasts.map((f) => (
                    <tr key={f.providerName} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-800">{f.providerName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-700">{formatAmount(f.currentBalance)}₽</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${f.apiHealth === 'UP' ? 'text-emerald-500' : f.apiHealth === 'SLOW' ? 'text-amber-500' : 'text-rose-500'}`}>
                            {f.apiHealth === 'UP' ? '● В СЕТИ' : f.apiHealth === 'SLOW' ? '● МЕДЛЕННО' : '○ ОФФЛАЙН'}
                          </span>
                          <div className="text-xs font-mono font-bold text-slate-600">
                            {f.latency}ms
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-indigo-600">
                          {f.avgSpeed > 0 ? `~${f.avgSpeed}h` : 'N/A'}
                        </div>
                        <div className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Ср. выполнение</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CalendarCheck size={14} className="text-slate-400" />
                          <div className={`text-sm font-bold ${f.status === 'CRITICAL' ? 'text-rose-600' : 'text-slate-700'}`} suppressHydrationWarning>
                            {f.ml.isLearning ? 'Обучение...' : new Date(f.ml.projectedDepletionDate).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 w-24">
                          <div className="flex justify-between text-[9px] font-bold uppercase text-slate-400">
                            <span>Уверенность</span>
                            <span>{f.ml.confidence}%</span>
                          </div>
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${f.ml.confidence > 80 ? 'bg-emerald-500' : f.ml.confidence > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${f.ml.confidence}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${f.status === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          f.status === 'WARNING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                          {f.status === 'CRITICAL' ? 'КРИТИЧЕСКИ' : f.status === 'WARNING' ? 'ВНИМАНИЕ' : 'НОРМА'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}


      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight flex items-center gap-2">
            <div className="p-2 bg-slate-900 text-white rounded-lg"><CreditCard size={18} /></div>
            Список провайдеров
          </h3>
          <div className="text-sm text-slate-500 font-medium">
            Всего провайдеров: <span className="text-slate-900 font-bold">{providers.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                <th className="px-8 py-5">Провайдер</th>
                <th className="px-6 py-5">Баланс</th>
                <th className="px-6 py-5">Услуги</th>
                <th className="px-6 py-5">Статус</th>
                <th className="px-6 py-5">API Health</th>
                <th className="px-6 py-5 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {providers.map((provider) => {
                const forecast = financials?.forecasts.find(f => f.providerName === provider.name);

                return (
                  <tr key={provider.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <div className="font-bold text-slate-800 text-sm uppercase tracking-tight flex items-center gap-2">
                          {provider.name}
                          {!provider.projectId ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold border border-slate-200 uppercase tracking-tighter">
                              <Globe size={10} /> Глобальный
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded text-[9px] font-bold border border-sky-100 uppercase tracking-tighter">
                              <Briefcase size={10} /> Проект №{provider.projectId.slice(-4)}
                            </span>
                          )}
                          {provider.type !== 'universal' && (
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold border border-indigo-100">{provider.type}</span>
                          )}
                          {(['stream-promotion', 'vexboost'].includes(provider.type) || (provider.metadata as any)?.currency === 'USD') && (
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold border border-emerald-100">USD</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[120px]" title={provider.id}>
                          {provider.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <div className="font-black text-slate-800 text-sm">
                          {(() => {
                            const meta = provider.metadata as any;
                            // Use balanceCurrency if set, otherwise fallback to provider currency (or default RUB/USD based on type)
                            const currency = meta?.balanceCurrency || meta?.currency || (['stream-promotion'].includes(provider.type) ? 'USD' : 'RUB');
                            const symbol = currency === 'USD' ? '$' : '₽';
                            return `${symbol}${formatAmount(provider.currentBalance)}`;
                          })()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                          {(() => {
                            const meta = provider.metadata as any;
                            // Use balanceCurrency if set, otherwise fallback to provider currency (or default RUB/USD based on type)
                            const currency = meta?.balanceCurrency || meta?.currency || (['stream-promotion'].includes(provider.type) ? 'USD' : 'RUB');
                            const symbol = currency === 'USD' ? '$' : '₽';
                            return `Порог: ${symbol}${formatAmount(provider.balanceThreshold)}`;
                          })()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Link
                        href={`/admin/services?providerId=${provider.id}`}
                        className="flex items-center gap-2 group/count hover:opacity-80 transition-all"
                      >
                        <div className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200 group-hover/count:bg-blue-50 group-hover/count:text-blue-600 group-hover/count:border-blue-100 transition-colors">
                          {provider.serviceCount || 0}
                        </div>
                        {(provider.serviceCount || 0) > 0 && (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight group-hover/count:text-blue-500 transition-colors">услуг</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${provider.isEnabled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${provider.isEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {provider.isEnabled ? 'Активен' : 'Отключен'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {forecast ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${forecast.apiHealth === 'UP' ? 'bg-emerald-500' : forecast.apiHealth === 'SLOW' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                            <span className={`text-[10px] font-bold uppercase ${forecast.apiHealth === 'UP' ? 'text-emerald-600' : forecast.apiHealth === 'SLOW' ? 'text-amber-600' : 'text-rose-600'}`}>
                              {forecast.apiHealth === 'UP' ? 'ОК' : forecast.apiHealth === 'SLOW' ? 'МЕДЛЕННО' : 'СБОЙ'}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 pl-3">
                            {forecast.latency}ms / {forecast.avgSpeed > 0 ? `${forecast.avgSpeed}h` : '-'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-bold uppercase">Нет данных</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button
                          onClick={() => openPaymentModal(provider)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                          title="Пополнить баланс"
                        >
                          <CreditCard size={18} />
                        </button>
                        <button
                          onClick={() => openSecurityModal(provider)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                          title="Отчет безопасности"
                        >
                          <ShieldCheck size={18} />
                        </button>
                        <button
                          onClick={() => handleSyncProvider(provider.id)}
                          disabled={syncingProviders.has(provider.id)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50"
                          title="Синхронизировать услуги"
                        >
                          {syncingProviders.has(provider.id) ? <Loader2 size={18} className="animate-spin text-blue-600" /> : <RefreshCcw size={18} />}
                        </button>
                        <button
                          onClick={() => openDetails(provider)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title="Детали"
                        >
                          <Activity size={18} />
                        </button>
                        <button
                          onClick={() => openEdit(provider)}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                          title="Настройки"
                        >
                          <Settings size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(provider.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Удалить"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {providers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-400 text-sm">
                    Нет доступных провайдеров. Добавьте первого!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {(isEditModalOpen || isAddModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h3 className="font-black text-slate-800 uppercase italic">{formData.id ? 'Настройки провайдера' : 'Новый провайдер'}</h3>
              <button onClick={() => { setIsEditModal(false); setIsAddModal(false); }} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Название (ID в системе)</label>
                <input
                  required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VEXBOOST"
                  disabled={!!formData.id} // Name cannot be changed usually
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none uppercase disabled:opacity-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Тип драйвера</label>
                  <select
                    value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    <option value="universal">Universal (Custom)</option>
                    <option value="perfect-panel">Perfect Panel (Standard)</option>
                    <option value="vexboost">VexBoost</option>
                    <option value="stream-promotion">Stream Promotion</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Порог уведомления (₽)</label>
                  <input
                    type="number"
                    required value={formData.balanceThreshold} onChange={e => setFormData({ ...formData, balanceThreshold: e.target.value })}
                    placeholder="1000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Валюта Баланса</label>
                  <select
                    value={formData.balanceCurrency} onChange={e => setFormData({ ...formData, balanceCurrency: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    <option value="RUB">RUB (₽)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="TRY">TRY (₺)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Валюта Цен (Прайс)</label>
                  <select
                    value={formData.pricesCurrency} onChange={e => setFormData({ ...formData, pricesCurrency: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    <option value="RUB">RUB (₽)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="TRY">TRY (₺)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">API Endpoint URL</label>
                <input
                  required value={formData.apiUrl} onChange={e => setFormData({ ...formData, apiUrl: e.target.value })}
                  placeholder="https://provider.com/api/v2"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">API Ключ провайдера</label>
                <input
                  type="password"
                  required value={formData.apiKey} onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Вставьте ваш API ключ"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <input
                  type="checkbox" id="enabled" checked={formData.isEnabled}
                  onChange={e => setFormData({ ...formData, isEnabled: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="enabled" className="text-xs font-bold text-slate-700 cursor-pointer">Провайдер активен</label>
              </div>

              <MetadataBuilder
                initialValue={formData.metadata}
                onValueChange={(val) => setFormData(prev => ({ ...prev, metadata: val }))}
              />

              <div className="sticky bottom-0 pt-4 bg-white border-t border-slate-50">
                <button type="submit" disabled={isSaving} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailsModalOpen && selectedProvider && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-800 uppercase italic">Технические данные: {selectedProvider.name}</h3>
              <button onClick={() => setIsDetailsModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Provider ID</div>
                  <div className="text-xs font-mono font-bold truncate">{selectedProvider.id}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <div className="text-[9px] font-black text-slate-400 uppercase mb-1">API Key Hint</div>
                  <div className="text-xs font-mono font-bold truncate">****{selectedProvider.apiKey.slice(-4)}</div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <div className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><ExternalLink size={10} /> Endpoint</div>
                <div className="text-xs font-mono font-bold break-all">{selectedProvider.apiUrl}</div>
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Metadata (Auto-config)</h4>
                <div className="p-4 bg-slate-900 rounded-2xl">
                  <pre className="text-[10px] text-blue-300 font-mono overflow-auto custom-scrollbar">
                    {JSON.stringify(selectedProvider.metadata || { type: 'standard', engine: 'v2' }, null, 2)}
                  </pre>
                </div>
              </div>

              {financials?.forecasts.find(f => f.providerName === selectedProvider.name) && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Анализ уверенности ML</h4>
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-900">Уровень доверия</span>
                      <span className="text-xs font-black text-indigo-600">{financials.forecasts.find(f => f.providerName === selectedProvider.name)?.ml.confidence}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-indigo-200 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${financials.forecasts.find(f => f.providerName === selectedProvider.name)?.ml.confidence}%` }}></div>
                    </div>

                    <div className="space-y-1">
                      {financials.forecasts.find(f => f.providerName === selectedProvider.name)?.ml.details?.map((detail: string, i: number) => (
                        <div key={i} className="text-[10px] font-medium text-indigo-800 flex items-start gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0"></span>
                          {detail}
                        </div>
                      ))}
                      {(!financials.forecasts.find(f => f.providerName === selectedProvider.name)?.ml.details) && (
                        <div className="text-[10px] text-indigo-400 italic">Нет детальных данных</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <h3 className="font-black text-emerald-900 uppercase italic">Пополнение {paymentData.providerName}</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-emerald-400 hover:text-emerald-600"><X size={24} /></button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Сумма пополнения</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number" step="0.01" required
                    value={paymentData.amount} onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                    placeholder="100.00"
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-black text-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Тип операции</label>
                <select
                  value={paymentData.type}
                  onChange={e => setPaymentData({ ...paymentData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                >
                  <option value="TOPUP">Пополнение (Top Up)</option>
                  <option value="ADJUSTMENT">Корректировка</option>
                  <option value="REFUND">Возврат (Refund)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Комментарий (опционально)</label>
                <input
                  value={paymentData.description} onChange={e => setPaymentData({ ...paymentData, description: e.target.value })}
                  placeholder="Например: Пополнение с карты #1234"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
                />
              </div>

              <button type="submit" disabled={isSaving} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20">
                {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'Записать пополнение'}
              </button>
            </form>
          </div>
        </div>
      )}

      {securityProvider && (
        <SecurityReportModal
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
          provider={securityProvider}
        />
      )}
    </div>
  );
}

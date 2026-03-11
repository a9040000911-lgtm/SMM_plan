/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { ArrowLeft, Save, Globe, Key, Settings2, Code, Laptop } from 'lucide-react';
import Link from 'next/link';
import { createProvider } from '../actions';
import { InfoTooltip } from '@/components/admin/core/info-tooltip';

export default function NewProviderPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Link href="/admin/providers" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Подключение провайдера</h2>
          <p className="text-sm text-slate-500">Настройка связи с поставщиком услуг.</p>
        </div>
      </div>

      <form action={createProvider} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Globe className="text-blue-500" size={20} />
              <h3 className="font-bold text-slate-800">Данные подключения</h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center">
                  Внутреннее имя
                  <InfoTooltip text="Название провайдера, которое будете видеть только вы в админке." />
                </label>
                <input name="name" type="text" required placeholder="Например: VexBoost" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center">
                  API Endpoint URL
                  <InfoTooltip text="Основной адрес API провайдера. Обычно заканчивается на /api/v2." />
                </label>
                <input name="apiUrl" type="url" required placeholder="https://panel.com/api/v2" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <Key size={14} /> API Ключ провайдера
                <InfoTooltip text="Ваш секретный ключ из личного кабинета провайдера. Никогда не передавайте его третьим лицам." />
              </label>
              <input name="apiKey" type="password" required placeholder="Вставьте ваш API ключ" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-8 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Code className="text-purple-500" size={20} />
              <h3 className="font-bold text-slate-800">Технические настройки API</h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center">
                  HTTP Метод
                  <InfoTooltip text="Способ отправки данных. 99% провайдеров используют POST. Используйте GET только если это указано в документации." />
                </label>
                <select name="httpMethod" className="w-full px-4 py-3 bg-purple-50 border border-purple-100 rounded-xl text-sm font-bold text-purple-700 outline-none">
                  <option value="POST">POST (Стандарт)</option>
                  <option value="GET">GET (Редко)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center">
                  Тип запроса
                  <InfoTooltip text="Form-Data отправляет данные как обычную форму. JSON Body отправляет данные как объект кода (требуется для современных API)." />
                </label>
                <select name="requestType" className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm font-bold text-blue-700 outline-none">
                  <option value="form">Form-Data (Стандарт)</option>
                  <option value="json">JSON Body</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Laptop className="text-emerald-500" size={20} />
              <h3 className="font-bold text-slate-800">HTTP Заголовки</h3>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center">
                Кастомные заголовки
                <InfoTooltip text="Дополнительная информация для сервера. Например, 'Authorization: Bearer ТОКЕН' или 'User-Agent: MySystem'." />
              </label>
              <textarea name="customHeaders" rows={4} placeholder="Key: Value" className="w-full px-4 py-3 bg-slate-950 text-emerald-400 border border-slate-800 rounded-xl text-xs font-mono" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6 text-white shadow-xl">
            <div className="flex items-center gap-2">
              <Settings2 className="text-blue-400" size={18} />
              <h3 className="font-bold text-sm">Публикация</h3>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-tight">Опрос (Polling)</span>
                <span className="text-[10px] text-slate-500">Авто-баланс и услуги</span>
              </div>
              <input name="isEnabled" type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
            </div>

            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
              <Save size={20} />
              Сохранить
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Eye, EyeOff, Copy, RotateCcw, Check, ShieldCheck,
    Zap, Download, ArrowRight, Database, Terminal, Braces
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateApiKey, revokeApiKey } from "@/app/_actions/user/apiKeyActions";

const API_METHODS = [
    {
        id: "services",
        name: "Список услуг",
        action: "services",
        description: "Получение полного списка доступных услуг с актуальными ценами и лимитами.",
        params: [
            { name: "key", type: "string", description: "Ваш API ключ", required: true },
            { name: "action", type: "string", description: "services", required: true }
        ],
        snippets: {
            curl: `curl -X POST https://smmplan.ru/api/v2 \\
  -F "key=YOUR_API_KEY" \\
  -F "action=services"`,
            python: `import requests\n\npayload = {\n    'key': 'YOUR_API_KEY',\n    'action': 'services'\n}\nresponse = requests.post('https://smmplan.ru/api/v2', data=payload)\nprint(response.json())`,
            php: `<?php\n$payload = [\n    'key' => 'YOUR_API_KEY',\n    'action' => 'services'\n];\n$ch = curl_init('https://smmplan.ru/api/v2');\ncurl_setopt($ch, CURLOPT_POSTFIELDS, $payload);\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n$result = curl_exec($ch);\nprint_r(json_decode($result, true));`
        }
    },
    {
        id: "add",
        name: "Создать заказ",
        action: "add",
        description: "Автоматическое создание нового заказа в системе.",
        params: [
            { name: "key", type: "string", description: "Ваш API ключ", required: true },
            { name: "action", type: "string", description: "add", required: true },
            { name: "service", type: "int", description: "ID услуги из списка", required: true },
            { name: "link", type: "string", description: "Ссылка на объект (профиль/пост)", required: true },
            { name: "quantity", type: "int", description: "Количество", required: true }
        ],
        snippets: {
            curl: `curl -X POST https://smmplan.ru/api/v2 \\
  -F "key=YOUR_API_KEY" \\
  -F "action=add" \\
  -F "service=102" \\
  -F "link=https://telegram.me/example" \\
  -F "quantity=100"`,
            python: `import requests\n\npayload = {\n    'key': 'YOUR_API_KEY',\n    'action': 'add',\n    'service': 102,\n    'link': 'https://t.me/example',\n    'quantity': 100\n}\nresponse = requests.post('https://smmplan.ru/api/v2', data=payload)\nprint(response.json())`,
            php: `<?php\n$payload = [\n    'key' => 'YOUR_API_KEY',\n    'action' => 'add',\n    'service' => 102,\n    'link' => 'https://t.me/example',\n    'quantity' => 100\n];\n$ch = curl_init('https://smmplan.ru/api/v2');\ncurl_setopt($ch, CURLOPT_POSTFIELDS, $payload);\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n$result = curl_exec($ch);\nprint_r(json_decode($result, true));`
        }
    },
    {
        id: "status",
        name: "Статус заказа",
        action: "status",
        description: "Проверка текущего статуса и списания по ID заказа.",
        params: [
            { name: "key", type: "string", description: "Ваш API ключ", required: true },
            { name: "action", type: "string", description: "status", required: true },
            { name: "order", type: "string", description: "ID заказа", required: true }
        ],
        snippets: {
            curl: `curl -X POST https://smmplan.ru/api/v2 \\
  -F "key=YOUR_API_KEY" \\
  -F "action=status" \\
  -F "order=order_id_here"`,
            python: `import requests\n\npayload = {\n    'key': 'YOUR_API_KEY',\n    'action': 'status',\n    'order': 'order_id_here'\n}\nresponse = requests.post('https://smmplan.ru/api/v2', data=payload)\nprint(response.json())`,
            php: `<?php\n$payload = [\n    'key' => 'YOUR_API_KEY',\n    'action' => 'status',\n    'order' => 'order_id_here'\n];\n$ch = curl_init('https://smmplan.ru/api/v2');\ncurl_setopt($ch, CURLOPT_POSTFIELDS, $payload);\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n$result = curl_exec($ch);\nprint_r(json_decode($result, true));`
        }
    }
];

interface ApiUIProps {
    initialApiKey: string | null;
}

export function ApiUI({ initialApiKey }: ApiUIProps) {
    const [apiKey, setApiKey] = useState(initialApiKey);
    const [isVisible, setIsVisible] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState(API_METHODS[0].id);
    const [activeLang, setActiveLang] = useState<"curl" | "python" | "php">("curl");

    const handleGenerate = async () => {
        setIsLoading(true);
        const res = await generateApiKey();
        if (res.success && res.key) {
            setApiKey(res.key);
            setIsVisible(true);
        }
        setIsLoading(false);
    };

    const handleRevoke = async () => {
        if (!confirm("Внимание: старый ключ мгновенно перестанет работать. Продолжить?")) return;
        setIsLoading(true);
        const res = await revokeApiKey();
        if (res.success) setApiKey(null);
        setIsLoading(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const currentMethod = API_METHODS.find(m => m.id === selectedMethod)!;

    return (
        <div className="space-y-12 pb-32">
            {/* Header with Key Management Card */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                <div className="space-y-3">
                    <h1 className="text-5xl font-black text-slate-950 tracking-tighter uppercase italic">
                        API <span className="text-blue-600">Терминал</span>
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Профессиональная интеграция ваших систем</p>

                    <div className="flex flex-wrap gap-3 pt-2">
                        <Badge label="Perfect Panel Compatible" icon={<Check size={12} />} color="emerald" />
                        <Badge label="High Rate Limits" icon={<Zap size={12} />} color="blue" />
                    </div>
                </div>

                <div className="w-full lg:w-[500px] bg-slate-950 rounded-[3rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden group border border-white/5">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 blur-[100px] pointer-events-none" />

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400 border border-white/5">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Личный ключ</h3>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">AES-256 ENCRYPTED</p>
                            </div>
                        </div>
                        {apiKey && (
                            <button onClick={handleRevoke} className="text-rose-400 hover:text-rose-300 transition-colors">
                                <RotateCcw size={16} />
                            </button>
                        )}
                    </div>

                    {apiKey ? (
                        <div className="space-y-6 relative z-10">
                            <div className="relative group/key">
                                <div className={cn(
                                    "w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 flex items-center font-mono text-sm transition-all",
                                    isVisible ? "text-blue-200" : "text-slate-800 tracking-[0.5em] select-none"
                                )}>
                                    {isVisible ? apiKey : "••••••••••••••••••••••••"}
                                </div>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                                    <button onClick={() => setIsVisible(!isVisible)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-blue-400 transition-all">
                                        {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                    <button onClick={() => copyToClipboard(apiKey)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-emerald-400 transition-all">
                                        {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>
                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest text-center italic">Не передавайте этот ключ третьим лицам</p>
                        </div>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full h-16 bg-blue-600 hover:bg-white hover:text-slate-950 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <><Zap size={18} /> Сгенерировать токен</>}
                        </button>
                    )}
                </div>
            </div>

            {/* Main Documentation Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                {/* Method Sidebar */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 pb-2">Каталог методов</div>
                    <div className="flex flex-col gap-3">
                        {API_METHODS.map(m => (
                            <button
                                key={m.id}
                                onClick={() => setSelectedMethod(m.id)}
                                className={cn(
                                    "p-6 rounded-[2rem] border transition-all text-left flex items-center justify-between group",
                                    selectedMethod === m.id ? "bg-slate-950 border-slate-900 shadow-2xl text-white" : "bg-white border-slate-100 text-slate-500 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 hover:text-slate-950"
                                )}
                            >
                                <span className="text-sm font-black uppercase tracking-tight">{m.name}</span>
                                <ArrowRight size={16} className={cn("transition-all duration-300", selectedMethod === m.id ? "text-blue-400" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0")} />
                            </button>
                        ))}
                    </div>

                    <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] space-y-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                            <Download size={20} />
                        </div>
                        <h4 className="text-sm font-black text-blue-900 uppercase">Полная документация</h4>
                        <p className="text-[10px] font-bold text-blue-700/60 leading-relaxed uppercase">Скачайте расширенное руководство пользователя в TXT формате для быстрого ознакомления.</p>
                        <button
                            onClick={() => window.open('/docs/api-v2.txt', '_blank')}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                            <Download size={14} />
                            Скачать DOCS
                        </button>
                    </div>
                </div>

                {/* Method Content */}
                <div className="lg:col-span-9 space-y-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedMethod}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            className="bg-white border border-slate-100 rounded-[3rem] p-8 lg:p-12 shadow-sm space-y-12"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tight italic">{currentMethod.name}</h2>
                                    <p className="text-sm font-bold text-slate-400 max-w-xl pr-4">{currentMethod.description}</p>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-950 p-1.5 rounded-2xl border border-white/5">
                                    <div className="px-5 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">POST</div>
                                    <div className="px-5 py-3 text-blue-300 text-[10px] font-mono tracking-widest">/api/v2</div>
                                </div>
                            </div>

                            {/* Parameters */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 text-slate-400 ml-4 pb-2">
                                    <Database size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Параметры запроса</span>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {currentMethod.params.map((p, i) => (
                                        <div key={p.name} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 italic">#{i + 1}</div>
                                                <div>
                                                    <code className="text-sm font-black text-blue-600">{p.name}</code>
                                                    <span className="ml-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.type}</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 max-w-md">
                                                <p className="text-[11px] font-bold text-slate-500 uppercase leading-none">{p.description}</p>
                                            </div>
                                            <div className={cn("px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border", p.required ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-100 text-slate-400 border-slate-200")}>
                                                {p.required ? "Обязательно" : "Опционально"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Snippets Area */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between ml-4">
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Terminal size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Примеры реализации</span>
                                    </div>
                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                                        {["curl", "python", "php"].map(l => (
                                            <button key={l} onClick={() => setActiveLang(l as any)} className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeLang === l ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}>
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="group/code relative">
                                    <div className="absolute right-4 top-4 opacity-0 group-hover/code:opacity-100 transition-all">
                                        <button onClick={() => copyToClipboard(currentMethod.snippets[activeLang])} className="p-3 bg-white/10 hover:bg-blue-600 text-white rounded-xl border border-white/10 transition-all backdrop-blur-md">
                                            {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                                        </button>
                                    </div>
                                    <div className="bg-slate-950 rounded-[2.5rem] p-8 lg:p-12 overflow-hidden border-2 border-slate-900 shadow-inner">
                                        <pre className="text-blue-100 font-mono text-sm leading-relaxed overflow-x-auto selection:bg-blue-500/30">
                                            {currentMethod.snippets[activeLang]}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            {/* Success Alert */}
                            <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-6">
                                <Braces className="text-blue-600 shrink-0 mt-1" size={24} />
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-blue-900 uppercase tracking-tight">JSON Формат ответа</p>
                                    <p className="text-[10px] font-bold text-blue-700/60 uppercase leading-relaxed max-w-lg">Все запросы возвращают стандартизированный JSON объект. Всегда проверяйте статус-коды ошибок перед обработкой данных.</p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function Badge({ label, icon, color }: { label: string, icon: any, color: 'emerald' | 'blue' }) {
    const cls = {
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100"
    };
    return (
        <div className={cn("px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-2", cls[color])}>
            {icon} {label}
        </div>
    );
}

import { Loader2 } from "lucide-react";

'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';

interface MetadataField {
    key: string;
    value: string;
}

interface MetadataBuilderProps {
    initialValue: string; // JSON string
    onValueChange?: (value: string) => void;
    name?: string; // для использования в стандартных формах
}

const PRESET_KEYS = [
    { key: 'requestType', label: 'Тип запроса (json/form)' },
    { key: 'method', label: 'HTTP Метод (POST/GET)' },
    { key: 'currency', label: 'Валюта (USD/RUB)' },
    { key: 'keyField', label: 'Поле ключа API (по умолч: key)' },
    { key: 'actionField', label: 'Поле действия (по умолч: action)' },
];

export function MetadataBuilder({ initialValue, onValueChange, name }: MetadataBuilderProps) {
    const [fields, setFields] = useState<MetadataField[]>([]);
    const [jsonValue, setJsonValue] = useState(initialValue || '{}');

    useEffect(() => {
        try {
            const parsed = JSON.parse(initialValue || '{}');
            const pairs = Object.entries(parsed).map(([key, value]) => ({
                key,
                value: typeof value === 'object' ? JSON.stringify(value) : String(value),
            }));
            setFields(pairs.length > 0 ? pairs : []);
            setJsonValue(initialValue || '{}');
        } catch {
            setFields([]);
            setJsonValue('{}');
        }
    }, [initialValue]);

    const updateFields = (newFields: MetadataField[]) => {
        setFields(newFields);
        const obj: Record<string, any> = {};
        newFields.forEach((f) => {
            if (f.key.trim()) {
                try {
                    if ((f.value.startsWith('{') && f.value.endsWith('}')) || (f.value.startsWith('[') && f.value.endsWith(']'))) {
                        obj[f.key.trim()] = JSON.parse(f.value);
                    } else {
                        obj[f.key.trim()] = f.value;
                    }
                } catch {
                    obj[f.key.trim()] = f.value;
                }
            }
        });
        const finalJson = JSON.stringify(obj);
        setJsonValue(finalJson);
        if (onValueChange) onValueChange(finalJson);
    };

    const addField = (key = '', value = '') => {
        updateFields([...fields, { key, value }]);
    };

    const removeField = (index: number) => {
        updateFields(fields.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, key: string, value: string) => {
        const newFields = [...fields];
        newFields[index] = { key, value };
        updateFields(newFields);
    };

    return (
        <div className="space-y-3">
            {name && <input type="hidden" name={name} value={jsonValue} />}
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">
                    Конструктор параметров
                </label>
                <div className="relative group">
                    <button
                        type="button"
                        className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition-colors"
                    >
                        <Plus size={12} /> Пресеты <ChevronDown size={10} />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl hidden group-hover:block z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                        {PRESET_KEYS.map((preset) => (
                            <button
                                key={preset.key}
                                type="button"
                                onClick={() => addField(preset.key, '')}
                                className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                {fields.map((field, index) => (
                    <div key={index} className="flex gap-2 animate-in slide-in-from-left-2 duration-200">
                        <input
                            type="text"
                            placeholder="Ключ"
                            value={field.key}
                            onChange={(e) => handleChange(index, e.target.value, field.value)}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono focus:ring-2 focus:ring-blue-500/10 outline-none"
                        />
                        <input
                            type="text"
                            placeholder="Значение"
                            value={field.value}
                            onChange={(e) => handleChange(index, field.key, e.target.value)}
                            className="flex-[2] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono focus:ring-2 focus:ring-blue-500/10 outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => removeField(index)}
                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}

                {fields.length === 0 && (
                    <div className="py-8 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2">
                        <p className="text-[10px] font-bold text-slate-300 uppercase italic">Нет дополнительных параметров</p>
                        <button
                            type="button"
                            onClick={() => addField()}
                            className="text-[10px] font-black text-blue-500 hover:underline uppercase tracking-tighter"
                        >
                            + Добавить первый параметр
                        </button>
                    </div>
                )}

                {fields.length > 0 && (
                    <button
                        type="button"
                        onClick={() => addField()}
                        className="w-full py-2 border border-dashed border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-all uppercase tracking-widest mt-2"
                    >
                        + Добавить поле
                    </button>
                )}
            </div>
        </div>
    );
}

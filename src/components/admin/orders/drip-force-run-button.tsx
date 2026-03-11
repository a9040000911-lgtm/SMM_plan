"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { useState } from "react";
import { Play } from "lucide-react";
import { useRouter } from "next/navigation";

interface ForceRunProps {
    orderId: number;
}

export function DripForceRunButton({ orderId }: ForceRunProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRun = async () => {
        if (!confirm("Вы уверены? Это принудительно запустит выполнение одной итерации Drip Feed прямо сейчас, игнорируя расписание.")) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}/run-drip`, {
                method: "POST"
            });
            const data = await res.json();

            if (res.ok) {
                alert("Успешно: " + data.message);
                router.refresh();
            } else {
                alert("Ошибка: " + data.error);
            }
        } catch {
            alert("Ошибка сети");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleRun}
            disabled={loading}
            className="flex items-center gap-1 text-[10px] font-bold bg-amber-500 text-white px-2 py-1 rounded hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
            <Play size={12} fill="currentColor" />
            {loading ? "ЗАПУСК..." : "FORCE RUN"}
        </button>
    );
}

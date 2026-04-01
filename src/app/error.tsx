"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Local Error Caught:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-semibold mb-2 text-zinc-900">
                Произошла ошибка при загрузке
            </h2>
            
            <p className="text-zinc-500 max-w-md mb-8">
                Мы не смогли загрузить этот раздел. Пожалуйста, попробуйте обновить страницу. Если проблема повторится, обратитесь в поддержку.
            </p>
            
            <Button 
                onClick={() => reset()}
                className="gap-2"
                size="lg"
            >
                <RefreshCcw className="w-4 h-4" />
                Обновить
            </Button>

            {process.env.NODE_ENV === 'development' && (
                <div className="mt-8 p-4 bg-zinc-100 rounded-lg text-left overflow-auto text-xs font-mono text-zinc-500 max-w-2xl w-full max-h-40 border border-zinc-200">
                    <p className="font-semibold text-zinc-700 mb-2">{error.message}</p>
                    {error.stack}
                </div>
            )}
        </div>
    );
}

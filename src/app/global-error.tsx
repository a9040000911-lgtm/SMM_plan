"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to Sentry or another error reporting service
        console.error("Global Error Caught:", error);
    }, [error]);

    return (
        <html lang="ru">
            <body className="antialiased min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans p-4">
                <div className="absolute top-4 right-4">
                    <ThemeToggle />
                </div>
                
                <div className="max-w-md w-full bg-white dark:bg-zinc-900 shadow-xl rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 text-center animate-in fade-in zoom-in duration-300">
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" />
                    </div>
                    
                    <h1 className="text-2xl font-bold mb-2">Критическая ошибка</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8">
                        Черт возьми, кажется, что-то сломалось на нашей стороне. Мы уже в курсе и чиним это.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => reset()}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Попробовать снова
                        </button>
                        <Link 
                            href="/"
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <Home className="w-4 h-4" />
                            На главную
                        </Link>
                    </div>
                    
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-8 p-4 bg-zinc-100 dark:bg-zinc-950 rounded-lg text-left overflow-auto text-xs font-mono text-zinc-500 max-h-40">
                            {error.message}
                            <br />
                            {error.stack}
                        </div>
                    )}
                </div>
            </body>
        </html>
    );
}

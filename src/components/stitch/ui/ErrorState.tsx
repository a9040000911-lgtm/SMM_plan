import React from 'react';

interface ErrorStateProps {
    title?: string;
    message?: string;
    retryLabel?: string;
    retryUrl?: string; // If provided, uses a link
    onRetry?: () => void; // If provided, uses a button
}

export function ErrorState({
    title = 'Ошибка загрузки данных',
    message = 'Не удалось загрузить данные. Пожалуйста, обновите страницу или попробуйте позже.',
    retryLabel = 'Обновить страницу',
    retryUrl,
    onRetry
}: ErrorStateProps) {
    return (
        <div className="w-full flex flex-col items-center justify-center min-h-[40vh] text-center px-6 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-400 text-2xl">
                ⚠️
            </div>
            <h2 className="text-xl font-black text-slate-800">{title}</h2>
            <p className="text-slate-500 text-sm max-w-sm">{message}</p>
            {retryUrl ? (
                <a 
                    href={retryUrl} 
                    className="mt-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                    {retryLabel}
                </a>
            ) : onRetry ? (
                <button 
                    onClick={onRetry}
                    className="mt-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                    {retryLabel}
                </button>
            ) : null}
        </div>
    );
}

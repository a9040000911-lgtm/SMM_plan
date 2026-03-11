'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import Link from 'next/link';

// --- CARD COMPONENT ---
interface AdminCardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    action?: React.ReactNode;
}

export function AdminCard({ children, className = '', title, action }: AdminCardProps) {
    return (
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
            {(title || action) && (
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    {title && <h3 className="font-bold text-slate-800 tracking-tight">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="p-0">
                {children}
            </div>
        </div>
    );
}

// --- STATUS BADGE COMPONENT ---
interface StatusBadgeProps {
    isActive?: boolean;
    status?: string; // Generic string status option
    activeText?: string;
    inactiveText?: string;
    className?: string;
}

export function StatusBadge({ isActive, status, activeText = 'Active', inactiveText = 'Inactive', className = '' }: StatusBadgeProps) {
    // Boolean mode
    if (isActive !== undefined) {
        return (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors ${isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-slate-50 text-slate-400 border-slate-200'
                } ${className}`}>
                {isActive ? activeText : inactiveText}
            </span>
        );
    }

    // String status mode - simplified for common statuses
    let colorClass = 'bg-slate-50 text-slate-400 border-slate-200';
    if (status === 'COMPLETED' || status === 'SUCCESS') colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'PROCESSING' || status === 'PENDING') colorClass = 'bg-amber-50 text-amber-700 border-amber-100';
    if (status === 'CANCELED' || status === 'FAILED' || status === 'ERROR') colorClass = 'bg-rose-50 text-rose-700 border-rose-100';

    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${colorClass} ${className}`}>
            {status}
        </span>
    );
}

// --- BUTTON COMPONENT ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    ...props
}: ButtonProps) {
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20 shadow-lg',
        secondary: 'bg-slate-800 text-white hover:bg-slate-900',
        outline: 'bg-transparent border border-slate-200 text-slate-600 hover:bg-slate-50',
        ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 border-transparent',
        destructive: 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20 shadow-lg'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-[10px] rounded-lg',
        md: 'px-5 py-2.5 text-xs rounded-xl',
        lg: 'px-8 py-4 text-sm rounded-2xl'
    };

    return (
        <button
            className={`inline-flex items-center justify-center font-bold tracking-tight transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none border ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}

// --- ACTION BUTTON/ICON ---
interface ActionButtonProps {
    icon: React.ReactNode;
    onClick?: () => void;
    href?: string;
    variant?: 'edit' | 'delete' | 'view' | 'default';
    className?: string;
    disabled?: boolean;
    title?: string;
}

export function ActionButton({ icon, onClick, href, variant = 'default', className = '', disabled, title }: ActionButtonProps) {
    let variantClasses = 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-transparent';

    if (variant === 'edit') variantClasses = 'text-blue-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100';
    if (variant === 'delete') variantClasses = 'text-slate-300 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100';
    if (variant === 'view') variantClasses = 'text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100';

    const baseClasses = `p-2 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses} ${className}`;

    if (href) {
        return (
            <Link href={href} className={baseClasses} title={title}>
                {icon}
            </Link>
        );
    }

    return (
        <button onClick={onClick} disabled={disabled} className={baseClasses} title={title}>
            {icon}
        </button>
    );
}

// --- HEADER COMPONENT ---
interface AdminHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export function AdminHeader({ title, subtitle, action }: AdminHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
                {subtitle && <p className="text-sm text-slate-500 font-medium mt-1">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

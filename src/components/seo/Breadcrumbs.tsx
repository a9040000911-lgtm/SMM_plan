import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
    // Generate JSON-LD schema for Google
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Главная',
                item: 'https://smmtoolbox.ru/' // Generic fallback, dynamically injected later ideally
            },
            ...items.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 2,
                name: item.label,
                item: `https://smmtoolbox.ru${item.href}`
            }))
        ]
    };

    return (
        <nav aria-label="Breadcrumb" className="mb-6 w-full overflow-x-auto pb-2 scrollbar-none">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
            />
            
            <ol className="flex items-center space-x-2 text-sm text-slate-500 font-medium whitespace-nowrap">
                <li>
                    <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-100">
                        <Home size={14} />
                        <span className="sr-only">Home</span>
                    </Link>
                </li>
                
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    
                    return (
                        <li key={item.href} className="flex items-center">
                            <ChevronRight size={14} className="text-slate-300 flex-shrink-0 mx-1" />
                            {isLast ? (
                                <span className="text-slate-900 font-bold px-2 py-1" aria-current="page">
                                    {item.label}
                                </span>
                            ) : (
                                <Link 
                                    href={item.href} 
                                    className="hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-slate-100"
                                >
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

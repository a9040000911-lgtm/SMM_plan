import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getClientProjectId } from '@/utils/project-resolver';

interface RelatedServicesProps {
    currentPlatform: string;
    currentCategory?: string;
}

/**
 * Generates an SEO inter-linking grid at the bottom of dynamic pages
 * Extracted from database via cross-platform taxonomy.
 */
export async function RelatedServices({ currentPlatform, currentCategory }: RelatedServicesProps) {
    const projectId = await getClientProjectId();
    if (!projectId) return null;

    const allPlatforms = await prisma.socialPlatform.findMany({
        where: { 
            isActive: true,
            slug: { not: currentPlatform } 
        },
        include: {
            serviceCategories: {
                where: { isActive: true, projectId },
                take: 2 
            }
        },
        take: 3 
    });

    if (allPlatforms.length === 0) return null;

    const relatedLinks = allPlatforms.flatMap(platform => 
        platform.serviceCategories.map(cat => ({
            platformName: platform.name,
            platformSlug: platform.slug,
            categoryName: cat.name,
            categorySlug: cat.slug || encodeURIComponent(cat.name.toLowerCase()),
            href: `/buy/${platform.slug.toLowerCase()}/${cat.slug || encodeURIComponent(cat.name.toLowerCase())}`
        }))
    ).slice(0, 6);

    if (relatedLinks.length === 0) return null;

    return (
        <section className="mt-24 pt-16 border-t border-slate-100">
            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-4">
                СВЯЗАННЫЕ НАПРАВЛЕНИЯ
                <span className="h-px bg-slate-100 flex-1"></span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {relatedLinks.map((link, i) => (
                    <Link 
                        key={`${link.platformSlug}-${link.categorySlug}-${i}`}
                        href={link.href}
                        className="group flex flex-col p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100/50 px-2 py-1 rounded-md">
                                {link.platformName}
                            </span>
                            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
                        <h4 className="text-slate-900 font-bold mb-1">
                            {link.categoryName} для {link.platformName}
                        </h4>
                        <p className="text-sm font-medium text-slate-500">
                            Продвижение и живой трафик
                        </p>
                    </Link>
                ))}
            </div>
        </section>
    );
}

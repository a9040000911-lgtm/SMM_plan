'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  totalPages: number;
}

import Link from 'next/link';

interface PaginationProps {
  totalPages: number;
}

export function Pagination({ totalPages }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get('page')) || 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        startPage = 1;
        endPage = 5;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
        endPage = totalPages;
      }

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {currentPage > 1 ? (
        <Link
          href={createPageURL(1)}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center"
        >
          <ChevronsLeft size={16} />
        </Link>
      ) : (
        <button disabled className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 opacity-30 cursor-not-allowed flex items-center justify-center">
          <ChevronsLeft size={16} />
        </button>
      )}

      {currentPage > 1 ? (
        <Link
          href={createPageURL(currentPage - 1)}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center"
        >
          <ChevronLeft size={16} />
        </Link>
      ) : (
        <button disabled className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 opacity-30 cursor-not-allowed flex items-center justify-center">
          <ChevronLeft size={16} />
        </button>
      )}

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span key={index} className="min-w-[40px] h-[40px] flex items-center justify-center text-slate-400 cursor-default">
                ...
              </span>
            );
          }

          const isCurrent = page === currentPage;

          if (isCurrent) {
            return (
              <button
                key={index}
                disabled
                className="min-w-[40px] h-[40px] flex items-center justify-center rounded-xl text-sm font-bold bg-blue-600 text-white shadow-lg shadow-blue-200 cursor-default"
              >
                {page}
              </button>
            );
          }

          return (
            <Link
              key={index}
              href={createPageURL(page)}
              className="min-w-[40px] h-[40px] flex items-center justify-center rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
            >
              {page}
            </Link>
          );
        })}
      </div>

      {currentPage < totalPages ? (
        <Link
          href={createPageURL(currentPage + 1)}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center"
        >
          <ChevronRight size={16} />
        </Link>
      ) : (
        <button disabled className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 opacity-30 cursor-not-allowed flex items-center justify-center">
          <ChevronRight size={16} />
        </button>
      )}

      {currentPage < totalPages ? (
        <Link
          href={createPageURL(totalPages)}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center"
        >
          <ChevronsRight size={16} />
        </Link>
      ) : (
        <button disabled className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 opacity-30 cursor-not-allowed flex items-center justify-center">
          <ChevronsRight size={16} />
        </button>
      )}
    </div>
  );
}



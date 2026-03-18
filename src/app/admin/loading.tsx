import React from 'react';

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar Skeleton */}
      <div className="w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200 p-6 flex-col hidden lg:flex">
        <div className="w-32 h-8 bg-slate-200 rounded-lg animate-pulse mb-12" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-slate-200 rounded animate-pulse" />
              <div className="w-24 h-4 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <div className="space-y-2">
              <div className="w-48 h-10 bg-slate-200 rounded-xl animate-pulse" />
              <div className="w-64 h-4 bg-slate-100 rounded-lg animate-pulse" />
            </div>
            <div className="w-32 h-12 bg-slate-200 rounded-xl animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white border border-slate-200 rounded-2xl p-6">
                <div className="w-12 h-12 bg-slate-100 rounded-lg animate-pulse mb-4" />
                <div className="w-20 h-4 bg-slate-50 rounded animate-pulse" />
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl h-96 animate-pulse" />
        </div>
      </div>
    </div>
  );
}



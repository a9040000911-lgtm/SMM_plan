export default function CatalogLoading() {
    return (
        <div className="w-full pb-32 pt-12 animate-pulse mt-12">
            <div className="max-w-6xl mx-auto px-6">
                {/* Hero Skeleton (mimics SEO header) */}
                <div className="mb-20 bg-slate-100/50 rounded-[3rem] py-16 px-8 border border-slate-100">
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-32 h-8 bg-slate-200 rounded-full" />
                        <div className="w-3/4 max-w-md h-12 bg-slate-200 rounded-2xl" />
                        <div className="w-1/2 max-w-sm h-6 bg-slate-200 rounded-xl" />
                    </div>
                </div>

                {/* Layout Skeleton */}
                <div className="hidden lg:flex items-start gap-12 relative">
                    {/* Sidebar */}
                    <div className="w-64 shrink-0 space-y-2 sticky top-32">
                        <div className="w-24 h-6 bg-slate-200 rounded-xl mb-6" />
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="w-full h-12 bg-slate-100 rounded-2xl" />
                        ))}
                    </div>
                    {/* Grid Content */}
                    <div className="flex-1 space-y-16 min-w-0">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="space-y-6">
                                <div className="w-48 h-8 bg-slate-200 rounded-xl" />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {[...Array(3)].map((_, j) => (
                                        <div key={j} className="h-48 bg-slate-100 rounded-3xl group" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Mobile Skeletons */}
                <div className="lg:hidden space-y-8">
                    <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="w-32 h-10 bg-slate-100 rounded-xl shrink-0" />
                            ))}
                    </div>
                    <div className="space-y-4">
                            <div className="w-40 h-6 bg-slate-200 rounded-xl mb-4" />
                            {[...Array(4)].map((_, j) => (
                                <div key={j} className="h-44 bg-slate-100 rounded-3xl" />
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

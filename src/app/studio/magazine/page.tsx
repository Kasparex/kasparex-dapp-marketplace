'use client';

import { MagazineEditor } from '@/components/magazines/editor/MagazineEditor';

export default function StudioMagazinePage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Halo Header */}
            <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 p-8 md:p-12">
                {/* Halo Background Glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full -ml-48 -mb-48" />

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full uppercase tracking-widest border border-blue-500/20">
                                    Magazine Studio
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                                Issue Editor
                            </h1>
                            <p className="text-zinc-400 text-lg max-w-xl">
                                Design your digital issues, manage contributors, and publish to the global Kasparex library.
                            </p>
                        </div>

                        <div className="hidden md:block">
                            <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                </div>
                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                    Interactive Magazines
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm">
                <MagazineEditor />
            </div>
        </div>
    );
}

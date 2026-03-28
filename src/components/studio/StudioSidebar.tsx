'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdPlacementGrid } from '@/components/ads/AdPlacementGrid';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';

interface SidebarItemProps {
    href: string;
    label: string;
    icon: React.ReactNode;
}

function SidebarItem({ href, label, icon }: SidebarItemProps) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                ? 'bg-[#02abb8]/10 text-[#02abb8] border border-[#02abb8]/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
        >
            <span className={`${isActive ? 'text-[#02abb8]' : 'text-zinc-500 group-hover:text-[#02abb8]'}`}>
                {icon}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider transition-colors truncate">
                {label}
            </span>
        </Link>
    );
}

export function StudioSidebar() {
    return (
        <UnifiedSidebar
            storageKeyPrefix="studio"
            header={(onHide) => (
                <SidebarHeader
                    backHref="/hub"
                    backLabel="Back to Hub"
                    onHide={onHide}
                />
            )}
            footer={
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-white/5">
                    <div className="flex flex-col gap-4">
                        <div className="px-2">
                            <AdPlacementGrid slotId="SIDEBAR_RANDOM" variant="sidebar" maxCellsShown={2} />
                            <p className="mt-1.5 text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-center">
                                Advertisement
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#02abb8] to-emerald-500 overflow-hidden" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase truncate">
                                    Creator Mode
                                </p>
                                <p className="text-[9px] font-bold text-zinc-500 uppercase">Beta Access</p>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <div className="space-y-8">
                <section>
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 px-2">
                        Workspace
                    </h3>
                    <nav className="space-y-1">
                        <SidebarItem
                            href="/studio/dashboard"
                            label="Dashboard"
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                        />
                        <SidebarItem
                            href="/studio/portfolio"
                            label="My Portfolio"
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745V20a2 2 0 002 2h14a2 2 0 002-2v-6.745zM18 8a2 2 0 11-4 0 2 2 0 014 0zM10 8a2 2 0 11-4 0 2 2 0 014 0z" /><path d="M6 5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v3H6V5z" /></svg>}
                        />
                        <SidebarItem
                            href="/studio/activity"
                            label="Activity & Records"
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                        />
                    </nav>
                </section>

                <section>
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 px-2">
                        Ads
                    </h3>
                    <nav className="space-y-1">
                        <SidebarItem
                            href="/studio/ads"
                            label="My Ads"
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>}
                        />
                    </nav>
                </section>

                <section>
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 px-2">
                        Editors
                    </h3>
                    <nav className="space-y-1">
                        <SidebarItem
                            href="/studio/vblog"
                            label="vBlog Article"
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                        />
                        <SidebarItem
                            href="/studio/magazine"
                            label="Magazine Editor"
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                        />
                        <SidebarItem
                            href="/studio/store"
                            label="Store Product"
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7l1 2m0 0l2 10a2 2 0 002 2h8a2 2 0 002-2l2-10m-14 0h14M9 21a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" /></svg>}
                        />
                    </nav>
                </section>

                <section>
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 px-2">
                        Assets
                    </h3>
                    <nav className="space-y-1">
                        <SidebarItem
                            href="/studio/media"
                            label="Media Library"
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                        />
                        <SidebarItem
                            href="/studio/history"
                            label="Generation History"
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        />
                    </nav>
                </section>
            </div>
        </UnifiedSidebar>
    );
}

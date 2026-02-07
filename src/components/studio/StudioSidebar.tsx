'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItemProps {
    href: string;
    label: string;
    emoji: string;
}

function SidebarItem({ href, label, emoji }: SidebarItemProps) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={`k-sidebar-item group ${isActive ? 'k-sidebar-item-active' : ''}`}
        >
            <span className="k-sidebar-emoji">{emoji}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider transition-colors truncate">
                {label}
            </span>
            {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#02abb8] rounded-r-full" />
            )}
        </Link>
    );
}

export function StudioSidebar() {
    return (
        <aside className="w-64 h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-xs">
                        KS
                    </div>
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                            Kasparex Studio
                        </h2>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">
                            Creator Workspace
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 px-4">
                        Workspace
                    </h3>
                    <nav className="space-y-1">
                        <SidebarItem href="/studio" label="Dashboard" emoji="🏠" />
                        <SidebarItem href="/studio/activity" label="Activity & Records" emoji="📊" />
                    </nav>
                </div>

                <div>
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 px-4">
                        Editors
                    </h3>
                    <nav className="space-y-1">
                        <SidebarItem href="/studio/vblog" label="vBlog Article" emoji="✍️" />
                        <SidebarItem href="/studio/magazine" label="Magazine Editor" emoji="📖" />
                        <SidebarItem href="/studio/store" label="Store Product" emoji="🛍️" />
                    </nav>
                </div>

                <div>
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 px-4">
                        Assets
                    </h3>
                    <nav className="space-y-1">
                        <SidebarItem href="/studio/assets" label="Media Library" emoji="🖼️" />
                        <SidebarItem href="/studio/history" label="Generation History" emoji="📜" />
                    </nav>
                </div>
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                <Link
                    href="/hub"
                    className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors uppercase tracking-widest"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Hub
                </Link>
            </div>
        </aside>
    );
}

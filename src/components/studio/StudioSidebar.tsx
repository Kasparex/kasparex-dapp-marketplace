'use client';

import { useState, useRef, useEffect } from 'react';
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
    const [isOpen, setIsOpen] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(256);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Load sidebar state from localStorage
    useEffect(() => {
        const savedHidden = localStorage.getItem('studio-sidebar-hidden');
        const savedWidth = localStorage.getItem('studio-sidebar-width');
        if (savedHidden === 'true') setIsHidden(true);
        if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
    }, []);

    // Save sidebar state to localStorage
    useEffect(() => {
        localStorage.setItem('studio-sidebar-hidden', String(isHidden));
    }, [isHidden]);

    useEffect(() => {
        localStorage.setItem('studio-sidebar-width', String(sidebarWidth));
    }, [sidebarWidth]);

    // Handle resize
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !sidebarRef.current) return;
            const sidebarRect = sidebarRef.current.getBoundingClientRect();
            const newWidth = e.clientX - sidebarRect.left;
            if (newWidth >= 200 && newWidth <= 500) {
                setSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing]);

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-20 left-4 z-40 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg"
                style={{ top: '5.5rem' }}
                aria-label="Toggle menu"
            >
                <svg
                    className="h-6 w-6 text-zinc-900 dark:text-zinc-100"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    {isOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-30 bg-black/50"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Show Sidebar Button - Fixed when hidden */}
            {isHidden && (
                <button
                    onClick={() => setIsHidden(false)}
                    className="hidden lg:block fixed left-0 top-20 z-[60] p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                    aria-label="Show sidebar"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}

            <aside
                ref={sidebarRef}
                className={`
          fixed lg:sticky top-16 lg:top-0 left-0 z-40
          h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]
          bg-white dark:bg-zinc-950
          border-r border-zinc-200 dark:border-zinc-800
          transform transition-all duration-300 ease-in-out
          flex flex-col overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isHidden ? 'lg:translate-x-[-100%]' : ''}
        `}
                style={{
                    width: isHidden ? 0 : `${sidebarWidth}px`,
                    minWidth: isHidden ? 0 : `${sidebarWidth}px`,
                    maxWidth: isHidden ? 0 : `${sidebarWidth}px`,
                }}
                onMouseMove={(e) => {
                    if (!isHidden && !isResizing && sidebarRef.current) {
                        const rect = sidebarRef.current.getBoundingClientRect();
                        const isOnBorder = e.clientX >= rect.right - 4 && e.clientX <= rect.right;
                        sidebarRef.current.style.cursor = isOnBorder ? 'col-resize' : '';
                    }
                }}
                onMouseDown={(e) => {
                    if (!isHidden && sidebarRef.current) {
                        const rect = sidebarRef.current.getBoundingClientRect();
                        if (e.clientX >= rect.right - 4 && e.clientX <= rect.right) {
                            e.preventDefault();
                            setIsResizing(true);
                        }
                    }
                }}
            >
                {/* Header with Back Link and Hide Button */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <Link
                        href="/hub"
                        className="text-zinc-500 hover:text-[#02abb8] font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Hub
                    </Link>
                    <button
                        onClick={() => setIsHidden(true)}
                        className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        aria-label="Hide sidebar"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-8">
                    <section>
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 px-2">
                            Workspace
                        </h3>
                        <nav className="space-y-1">
                            <SidebarItem href="/studio" label="Dashboard" emoji="🏠" />
                            <SidebarItem href="/studio/portfolio" label="My Portfolio" emoji="💼" />
                            <SidebarItem href="/studio/activity" label="Activity & Records" emoji="📊" />
                        </nav>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 px-2">
                            Editors
                        </h3>
                        <nav className="space-y-1">
                            <SidebarItem href="/studio/vblog" label="vBlog Article" emoji="✍️" />
                            <SidebarItem href="/studio/magazine" label="Magazine Editor" emoji="📖" />
                            <SidebarItem href="/studio/store" label="Store Product" emoji="🛍️" />
                        </nav>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 px-2">
                            Assets
                        </h3>
                        <nav className="space-y-1">
                            <SidebarItem href="/studio/media" label="Media Library" emoji="🖼️" />
                            <SidebarItem href="/studio/history" label="Generation History" emoji="⌛" />
                        </nav>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-white/5">
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
            </aside>
        </>
    );
}

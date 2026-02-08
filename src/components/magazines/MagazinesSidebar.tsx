'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Magazine, MagazineIssue } from '@/lib/magazines/types';

interface MagazinesSidebarProps {
    mode: 'listing' | 'issue' | 'utility';
    // Listing mode props
    categories?: string[];
    selectedCategory?: string;
    onCategoryChange?: (category: string) => void;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    tags?: string[];
    selectedTags?: string[];
    onTagToggle?: (tag: string) => void;
    // Issue mode props
    currentMagazine?: Magazine;
    issues?: MagazineIssue[];
    currentIssueId?: string;
}

export function MagazinesSidebar({
    mode,
    categories = [],
    selectedCategory = 'All',
    onCategoryChange,
    searchQuery = '',
    onSearchChange,
    tags = [],
    selectedTags = [],
    onTagToggle,
    currentMagazine,
    issues = [],
    currentIssueId,
}: MagazinesSidebarProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(256);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Filter expansion states
    const [categoriesExpanded, setCategoriesExpanded] = useState(true);
    const [tagsExpanded, setTagsExpanded] = useState(true);
    const [issuesExpanded, setIssuesExpanded] = useState(true);

    // Load sidebar state from localStorage
    useEffect(() => {
        const savedHidden = localStorage.getItem('magazines-sidebar-hidden');
        const savedWidth = localStorage.getItem('magazines-sidebar-width');
        if (savedHidden === 'true') setIsHidden(true);
        if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
    }, []);

    // Save sidebar state to localStorage
    useEffect(() => {
        localStorage.setItem('magazines-sidebar-hidden', String(isHidden));
    }, [isHidden]);

    useEffect(() => {
        localStorage.setItem('magazines-sidebar-width', String(sidebarWidth));
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

    const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
        <svg
            className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
    );

    const CollapsibleSection = ({
        title,
        icon,
        expanded,
        onToggle,
        children,
    }: {
        title: string;
        icon?: React.ReactNode;
        expanded: boolean;
        onToggle: () => void;
        children: React.ReactNode;
    }) => (
        <div className="mb-6">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 px-2 hover:text-[#02abb8] transition-colors group"
            >
                <div className="flex items-center gap-2">
                    {icon && <span className="text-[#02abb8] opacity-80 group-hover:opacity-100">{icon}</span>}
                    <span>{title}</span>
                </div>
                <ChevronIcon expanded={expanded} />
            </button>
            {expanded && <div className="space-y-1">{children}</div>}
        </div>
    );

    const isListing = mode === 'listing';
    const isIssue = mode === 'issue';
    const isUtility = mode === 'utility';

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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7-7" />
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
                    flex flex-col
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
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                    {/* Header with Back Link and Hide Button */}
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-black">
                        <Link
                            href={isUtility || !pathname.startsWith('/magazines') ? '/magazines' : '/hub'}
                            className="text-zinc-500 hover:text-[#02abb8] font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors group"
                        >
                            <svg className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                            </svg>
                            {isUtility || !pathname.startsWith('/magazines') ? 'Back to Magazines' : 'Back to Hub'}
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

                    <div className="flex-1 p-4">
                        {/* Utility Mode / Quick Links - Moved to Top */}
                        {(isListing || isUtility) && (
                            <div className="mb-8">
                                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 px-2">
                                    Quick Actions
                                </h3>
                                <nav className="space-y-1">
                                    <Link
                                        href="/magazines/dashboard"
                                        className={`k-sidebar-item group ${pathname === '/magazines/dashboard' ? 'k-sidebar-item-active' : ''}`}
                                    >
                                        <span className="text-[#02abb8] opacity-80 group-hover:opacity-100">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        </span>
                                        <span className="text-[11px] font-bold uppercase tracking-wider truncate">My Dashboard</span>
                                    </Link>
                                    <Link
                                        href="/magazines/editor"
                                        className={`k-sidebar-item group ${pathname === '/magazines/editor' ? 'k-sidebar-item-active' : ''}`}
                                    >
                                        <span className="text-[#02abb8] opacity-80 group-hover:opacity-100">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                        </span>
                                        <span className="text-[11px] font-bold uppercase tracking-wider truncate">Create Issue</span>
                                    </Link>
                                </nav>
                            </div>
                        )}

                        {/* Listing Mode: Categories */}
                        {isListing && (
                            <CollapsibleSection
                                title="Categories"
                                icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>}
                                expanded={categoriesExpanded}
                                onToggle={() => setCategoriesExpanded(!categoriesExpanded)}
                            >
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => onCategoryChange?.(cat)}
                                        className={`w-full k-sidebar-item group ${selectedCategory === cat ? 'k-sidebar-item-active' : ''}`}
                                    >
                                        <span className="text-[11px] font-bold uppercase tracking-wider transition-colors truncate">
                                            {cat}
                                        </span>
                                        {selectedCategory === cat && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#02abb8] rounded-r-full shadow-[0_0_10px_#02abb8]" />
                                        )}
                                    </button>
                                ))}
                            </CollapsibleSection>
                        )}

                        {/* Listing Mode: Tags */}
                        {isListing && tags.length > 0 && (
                            <CollapsibleSection
                                title="Popular Tags"
                                icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
                                expanded={tagsExpanded}
                                onToggle={() => setTagsExpanded(!tagsExpanded)}
                            >
                                <div className="flex flex-wrap gap-2 px-2 py-1">
                                    {tags.map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => onTagToggle?.(tag)}
                                            className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${selectedTags.includes(tag)
                                                ? 'bg-[#02abb8] text-white shadow-lg shadow-[#02abb8]/20'
                                                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                                                }`}
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        )}

                        {/* Issue Mode: Magazine Issue List */}
                        {isIssue && currentMagazine && (
                            <CollapsibleSection
                                title="Magazine Issues"
                                icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.247 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                                expanded={issuesExpanded}
                                onToggle={() => setIssuesExpanded(!issuesExpanded)}
                            >
                                <div className="px-1 mb-4">
                                    <p className="text-[10px] font-bold text-zinc-400 mb-2 truncate italic px-1">
                                        {currentMagazine.name}
                                    </p>
                                </div>
                                {issues.map((issue) => (
                                    <Link
                                        key={issue.id}
                                        href={`/magazines/${currentMagazine.slug}/${issue.issueNumber}`}
                                        className={`w-full k-sidebar-item group ${currentIssueId === issue.id ? 'k-sidebar-item-active' : ''}`}
                                    >
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="text-[11px] font-bold uppercase tracking-wider transition-colors truncate mb-0.5">
                                                {issue.title}
                                            </div>
                                            <div className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                Issue #{issue.issueNumber}
                                                {issue.isPurchased && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Purchased" />
                                                )}
                                            </div>
                                        </div>
                                        {currentIssueId === issue.id && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#02abb8] rounded-r-full shadow-[0_0_10px_#02abb8]" />
                                        )}
                                    </Link>
                                ))}
                            </CollapsibleSection>
                        )}
                    </div>

                    {/* Footer Section */}
                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-black mt-auto">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#02abb8]/10 text-[#02abb8] flex items-center justify-center font-black text-[10px]">
                                KM
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest truncate">
                                    Kasparex Mag
                                </p>
                                <p className="text-[9px] font-bold text-zinc-500 uppercase">Publishing Suite</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(161, 161, 170, 0.2);
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(63, 63, 70, 0.4);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(161, 161, 170, 0.4);
                }
            `}</style>
        </>
    );
}

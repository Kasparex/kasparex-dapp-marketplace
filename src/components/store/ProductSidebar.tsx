'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { UnifiedStatusBox } from '@/components/rewards/UnifiedStatusBox';

export function ProductSidebar() {
    // Sidebar hide/show and resize state
    const [isHidden, setIsHidden] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(256); // Default 256px (w-64)
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Load sidebar state from localStorage
    useEffect(() => {
        const savedHidden = localStorage.getItem('product-sidebar-hidden');
        const savedWidth = localStorage.getItem('product-sidebar-width');
        if (savedHidden === 'true') setIsHidden(true);
        if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
    }, []);

    // Save sidebar state to localStorage
    useEffect(() => {
        localStorage.setItem('product-sidebar-hidden', String(isHidden));
    }, [isHidden]);

    useEffect(() => {
        localStorage.setItem('product-sidebar-width', String(sidebarWidth));
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
            {/* Mobile menu button - Not needed here as we don't have mobile menu logic yet, 
          but keeping consistent with Sidebar.tsx structure if we want mobile toggle later. 
          For now, just the desktop hide/show button. */}

            {/* Show Sidebar Button - Fixed when hidden */}
            {isHidden && (
                <button
                    onClick={() => setIsHidden(false)}
                    className="hidden lg:block fixed left-0 top-24 z-[30] p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-r transition-colors border border-l-0 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm"
                    aria-label="Show sidebar"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}

            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                className={`
          hidden lg:block
          relative flex-shrink-0
          bg-white dark:bg-zinc-950
          border-r border-zinc-200 dark:border-zinc-800
          transition-all duration-300 ease-in-out
          ${isHidden ? 'w-0 overflow-hidden border-none' : ''}
        `}
                style={{
                    width: isHidden ? 0 : `${sidebarWidth}px`,
                    minWidth: isHidden ? 0 : `${sidebarWidth}px`,
                    maxWidth: isHidden ? 0 : `${sidebarWidth}px`,
                    cursor: isResizing ? 'col-resize' : ''
                }}
                onMouseMove={(e) => {
                    if (!isHidden && !isResizing && sidebarRef.current) {
                        const rect = sidebarRef.current.getBoundingClientRect();
                        // Full height border detection (right side)
                        const isOnBorder = e.clientX >= rect.right - 4 && e.clientX <= rect.right;
                        sidebarRef.current.style.cursor = isOnBorder ? 'col-resize' : '';
                        if (isOnBorder) {
                            sidebarRef.current.style.borderRight = '2px solid #06b6d4';
                        } else {
                            sidebarRef.current.style.borderRight = '';
                        }
                    }
                }}
                onMouseLeave={() => {
                    if (sidebarRef.current && !isResizing) {
                        sidebarRef.current.style.borderRight = '';
                    }
                }}
                onMouseDown={(e) => {
                    // Make the right border draggable (full height)
                    if (!isHidden && sidebarRef.current) {
                        const rect = sidebarRef.current.getBoundingClientRect();
                        if (e.clientX >= rect.right - 4 && e.clientX <= rect.right) {
                            e.preventDefault();
                            setIsResizing(true);
                        }
                    }
                }}
            >
                <div className="h-full overflow-y-auto">
                    {/* Header with Hide Button */}
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <Link
                            href="/store"
                            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors text-sm flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Store
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

                    {/* Sidebar Content */}
                    <div className="p-4">
                        <UnifiedStatusBox />
                    </div>
                </div>
            </aside>
        </>
    );
}

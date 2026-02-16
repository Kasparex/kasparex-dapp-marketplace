'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';

export type VBlogSortOption =
    | 'newest'
    | 'oldest'
    | 'alphabetical-az'
    | 'alphabetical-za';

interface VBlogSortFiltersProps {
    sortBy: VBlogSortOption;
    onSortChange: (sort: VBlogSortOption) => void;
    onAddArticle?: () => void;
}

export function VBlogSortFilters({ sortBy, onSortChange, onAddArticle }: VBlogSortFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
    const [sortDropdownStyle, setSortDropdownStyle] = useState<{ bottom: number; left: number } | null>(null);
    const [plusDropdownStyle, setPlusDropdownStyle] = useState<{ bottom: number; right: number } | null>(null);
    const sortTriggerRef = useRef<HTMLButtonElement>(null);
    const plusTriggerRef = useRef<HTMLButtonElement>(null);

    useLayoutEffect(() => {
        if (!isOpen || !sortTriggerRef.current) {
            setSortDropdownStyle(null);
            return;
        }
        const rect = sortTriggerRef.current.getBoundingClientRect();
        setSortDropdownStyle({
            bottom: window.innerHeight - rect.top + 8,
            left: rect.left,
        });
    }, [isOpen]);

    useLayoutEffect(() => {
        if (!isPlusMenuOpen || !plusTriggerRef.current) {
            setPlusDropdownStyle(null);
            return;
        }
        const rect = plusTriggerRef.current.getBoundingClientRect();
        setPlusDropdownStyle({
            bottom: window.innerHeight - rect.top + 8,
            right: window.innerWidth - rect.right,
        });
    }, [isPlusMenuOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortTriggerRef.current && !sortTriggerRef.current.contains(event.target as Node) &&
                !(event.target as Element).closest('[data-sort-dropdown]')) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (plusTriggerRef.current && !plusTriggerRef.current.contains(event.target as Node) &&
                !(event.target as Element).closest('[data-plus-dropdown]')) {
                setIsPlusMenuOpen(false);
            }
        };
        if (isPlusMenuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isPlusMenuOpen]);

    const sortOptions: { value: VBlogSortOption; label: string }[] = [
        { value: 'newest', label: 'Newly Created' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'alphabetical-az', label: 'Alphabetical (A-Z)' },
        { value: 'alphabetical-za', label: 'Alphabetical (Z-A)' },
    ];

    const currentLabel = sortOptions.find((opt) => opt.value === sortBy)?.label || 'Sort by...';

    return (
        <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="relative flex-shrink-0">
                <button
                    ref={sortTriggerRef}
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="k-control-btn w-full"
                >
                    <span className="truncate">{currentLabel}</span>
                    <svg
                        className="w-4 h-4 ml-auto"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[45]" onClick={() => setIsOpen(false)} aria-hidden />
                        {sortDropdownStyle && (
                            <div
                                data-sort-dropdown
                                className="fixed w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-[50] overflow-hidden"
                                style={{ bottom: sortDropdownStyle.bottom, left: sortDropdownStyle.left }}
                            >
                                {sortOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onSortChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sortBy === option.value
                                            ? 'bg-[#02abb8]/10 text-[#02abb8] dark:bg-[#02abb8]/20 font-medium'
                                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Plus Button with Dropdown */}
            <div className="relative">
                <button
                    ref={plusTriggerRef}
                    type="button"
                    onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                    className="k-control-icon-btn"
                    aria-label="More options"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>

                {isPlusMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-[45]" onClick={() => setIsPlusMenuOpen(false)} aria-hidden />
                        {plusDropdownStyle && (
                            <div
                                data-plus-dropdown
                                className="fixed w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-[50] overflow-hidden"
                                style={{ bottom: plusDropdownStyle.bottom, right: plusDropdownStyle.right }}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        onAddArticle?.();
                                        setIsPlusMenuOpen(false);
                                    }}
                                    className="block w-full text-left px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Create Article
                                </button>
                                <Link
                                    href="/vblog/dashboard"
                                    onClick={() => setIsPlusMenuOpen(false)}
                                    className="block w-full text-left px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Author Dashboard
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

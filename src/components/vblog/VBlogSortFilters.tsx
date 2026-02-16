'use client';

import { useState, useRef, useEffect } from 'react';
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
    const plusMenuRef = useRef<HTMLDivElement>(null);

    // Close plus menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
                setIsPlusMenuOpen(false);
            }
        };

        if (isPlusMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
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
                        <div
                            className="fixed inset-0 z-[45]"
                            onClick={() => setIsOpen(false)}
                        />
                        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-[50] overflow-hidden">
                            {sortOptions.map((option) => (
                                <button
                                    key={option.value}
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
                    </>
                )}
            </div>

            {/* Plus Button with Dropdown */}
            <div className="relative" ref={plusMenuRef}>
                <button
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
                        <div
                            className="fixed inset-0 z-[45]"
                            onClick={() => setIsPlusMenuOpen(false)}
                        />
                        <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-[50] overflow-hidden">
                            <button
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
                    </>
                )}
            </div>
        </div>
    );
}

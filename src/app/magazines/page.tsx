'use client';

import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MagazineHeader } from '@/components/magazines/MagazineHeader';
import { MagazineCard } from '@/components/magazines/MagazineCard';
import { MagazinesSidebar } from '@/components/magazines/MagazinesSidebar';
import { getAllMagazines } from '@/lib/magazines/data';
import { Magazine, MagazineSortOption } from '@/lib/magazines/types';

export default function MagazinesPage() {
    const [magazines, setMagazines] = useState<Magazine[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<MagazineSortOption>('newest');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load magazines
        const data = getAllMagazines();
        setMagazines(data);
        setIsLoading(false);
    }, []);

    const categories = useMemo(() => {
        const cats = new Set(magazines.map(m => m.category));
        return ['All', ...Array.from(cats)];
    }, [magazines]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { All: magazines.length };
        magazines.forEach(m => {
            counts[m.category] = (counts[m.category] ?? 0) + 1;
        });
        return counts;
    }, [magazines]);

    // Discover all unique tags from all issues (mock logic for now)
    const allTags = useMemo(() => {
        // In a real app, we might fetch tags from the API
        // For now, we'll use a fixed set or derive from data if available
        return ['history', 'ghostdag', 'mining', 'scalability', 'performance', 'mainnet', 'krc20', 'krex', 'guide'];
    }, []);

    const handleTagToggle = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const filteredMagazines = useMemo(() => {
        let filtered = [...magazines];

        // Filter by category
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(m => m.category === selectedCategory);
        }

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(m =>
                m.name.toLowerCase().includes(query) ||
                m.description.toLowerCase().includes(query) ||
                m.author.toLowerCase().includes(query)
            );
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'newest') return -1; // Mock: latest on top
            if (sortBy === 'alphabetical-az') return a.name.localeCompare(b.name);
            return 0;
        });

        return filtered;
    }, [magazines, selectedCategory, searchQuery, sortBy]);

    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <div className="flex flex-1">
                <MagazinesSidebar
                    mode="listing"
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    categoryCounts={categoryCounts}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    tags={allTags}
                    selectedTags={selectedTags}
                    onTagToggle={handleTagToggle}
                />

                <main className="flex-1 w-full p-4 sm:p-6 lg:p-12 overflow-y-auto bg-white dark:bg-zinc-950">
                    <div className="w-full">
                        <div className="mb-12">
                            <MagazineHeader />
                        </div>

                        {/* Controls Bar: Search and Sort */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            {/* Search Bar - Moved from Sidebar */}
                            <div className="flex-1 max-w-md">
                                <div className="k-search-container">
                                    <input
                                        type="text"
                                        placeholder="Search magazines..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="k-search-input"
                                    />
                                </div>
                            </div>

                            {/* Sort UI - Standardized Style */}
                            <div className="flex items-center gap-2">
                                <div className="relative group">
                                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-xl px-1.5 py-1 border border-zinc-200 dark:border-zinc-800">
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Sort</span>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as MagazineSortOption)}
                                            className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer pr-4 text-zinc-900 dark:text-zinc-100 appearance-none py-1.5"
                                        >
                                            <option value="newest" className="bg-white dark:bg-zinc-900">Newest Created</option>
                                            <option value="alphabetical-az" className="bg-white dark:bg-zinc-900">Alphabetical (A-Z)</option>
                                        </select>
                                        <svg className="w-3.5 h-3.5 text-zinc-400 -ml-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : filteredMagazines.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredMagazines.map((mag) => (
                                    <MagazineCard key={mag.id} magazine={mag} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                <h3 className="text-xl font-bold text-zinc-600 dark:text-zinc-400 mb-2">No magazines found</h3>
                                <p className="text-zinc-500 dark:text-zinc-500 text-sm">Try adjusting your filters in the sidebar.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    );
}

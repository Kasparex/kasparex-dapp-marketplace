'use client';

import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MagazineHeader } from '@/components/magazines/MagazineHeader';
import { MagazineCard } from '@/components/magazines/MagazineCard';
import { getAllMagazines } from '@/lib/magazines/data';
import { Magazine, MagazineSortOption } from '@/lib/magazines/types';

export default function MagazinesPage() {
    const [magazines, setMagazines] = useState<Magazine[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<MagazineSortOption>('newest');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
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

            <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-12">
                <MagazineHeader />

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    {/* Categories */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${selectedCategory === cat
                                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        {/* Search */}
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Search magazines..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                            />
                            <svg className="absolute right-3 top-3 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as MagazineSortOption)}
                            className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all appearance-none cursor-pointer pr-10"
                        >
                            <option value="newest">Newest First</option>
                            <option value="alphabetical-az">Alphabetical A-Z</option>
                        </select>
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
                        <p className="text-zinc-500 dark:text-zinc-500">Try adjusting your filters or search query.</p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

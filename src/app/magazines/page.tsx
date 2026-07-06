'use client';

import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MagazineHeader } from '@/components/magazines/MagazineHeader';
import { MagazineCard } from '@/components/magazines/MagazineCard';
import { MagazinesSidebar } from '@/components/magazines/MagazinesSidebar';
import { MagazineSortFilters } from '@/components/magazines/MagazineSortFilters';
import { FilterBar } from '@/components/FilterBar';
import { getAllMagazines } from '@/lib/magazines/data';
import { Magazine, MagazineSortOption } from '@/lib/magazines/types';
import { bootstrapHubContent, onHubContentVisibilityRefresh } from '@/lib/hub/contentSync';
import { HUB_MAIN_COLUMN, HUB_PAGE_BG } from '@/lib/hub/hubLayout';
import { HubPageAccentLayout } from '@/components/hub/HubPageAccentLayout';
import { HubListingTitleRow } from '@/components/hub/HubListingTitleRow';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';

export default function MagazinesPage() {
    const [magazines, setMagazines] = useState<Magazine[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<MagazineSortOption>('newest');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            await bootstrapHubContent(['magazines', 'magazineIssues']);
            if (!cancelled) {
                setMagazines(getAllMagazines());
                setIsLoading(false);
            }
        };
        void load();
        const stop = onHubContentVisibilityRefresh(() => {
            setMagazines(getAllMagazines());
        }, ['magazines', 'magazineIssues']);
        const onIssues = () => setMagazines(getAllMagazines());
        window.addEventListener('kasparex-magazine-issues-updated', onIssues);
        return () => {
            cancelled = true;
            stop();
            window.removeEventListener('kasparex-magazine-issues-updated', onIssues);
        };
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

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedCategory('All');
        setSelectedTags([]);
        setSortBy('newest');
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
            if (sortBy === 'newest') return (b.totalIssues ?? 0) - (a.totalIssues ?? 0);
            if (sortBy === 'oldest') return (a.totalIssues ?? 0) - (b.totalIssues ?? 0);
            if (sortBy === 'alphabetical-az') return a.name.localeCompare(b.name);
            if (sortBy === 'alphabetical-za') return b.name.localeCompare(a.name);
            return 0;
        });

        return filtered;
    }, [magazines, selectedCategory, searchQuery, sortBy]);

    return (
        <div className={`flex flex-col min-h-screen ${HUB_PAGE_BG}`}>
            <Header />

            <div className="flex flex-1">
                <HubPageAccentLayout projectId="kasparex-magazines">
                <MagazinesSidebar
                    mode="listing"
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    categoryCounts={categoryCounts}
                    tags={allTags}
                    selectedTags={selectedTags}
                    onTagToggle={handleTagToggle}
                />

                <div className={HUB_MAIN_COLUMN}>
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-12">
                            <MagazineHeader />
                        </div>

                        <div id="content" className="scroll-mt-4" />

                        <HubListingTitleRow
                            projectId="kasparex-magazines"
                            title="Available magazines"
                            count={filteredMagazines.length}
                            countLabel="magazine"
                            countLoading={isLoading}
                            loadingText="Loading magazines..."
                            benefits={<HubBenefitsPanel variant="compact" className="w-full" />}
                        />

                        {/* Controls Area - FilterBar (dApps pattern) */}
                        <div className="flex flex-col gap-4 mb-8">
                            <FilterBar
                                search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search magazines...' }}
                                onReset={handleResetFilters}
                            >
                                <MagazineSortFilters sortBy={sortBy} onSortChange={setSortBy} />
                            </FilterBar>
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
                </div>
                </HubPageAccentLayout>
            </div>

            <Footer />
        </div>
    );
}

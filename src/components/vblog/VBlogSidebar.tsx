'use client';

import Link from 'next/link';
import { VBlogArticle } from '@/lib/vblog/types';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import { SidebarCategories } from '@/components/sidebar/SidebarCategories';
import { SidebarTags } from '@/components/sidebar/SidebarTags';

interface VBlogSidebarProps {
  articles: VBlogArticle[];
  selectedCategory: string | null;
  selectedTags: string[];
  searchQuery: string;
  onCategoryChange: (category: string | null) => void;
  onTagToggle: (tag: string) => void;
  onSearchChange: (query: string) => void;
  onCreateArticle?: () => void;
  activeView?: 'explore' | 'dashboard';
}

function VBlogCategoryIcon({ id, className = '' }: { id: string | null; className?: string }) {
  const iconProps = { className: `k-sidebar-icon ${className}`, strokeWidth: 2, fill: 'none' as const, viewBox: '0 0 24 24', stroke: 'currentColor' as const };
  if (!id) return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
  switch (id.toLowerCase()) {
    case 'announcement': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A1.76 1.76 0 015 15.066V15c0 .115.022.23.064.338a.98.98 0 00.936.662H9c.552 0 1 .448 1 1s-.448 1-1 1H7.618a2 2 0 01-1.789-1.106l-.53-.1.53.1zm14.11-6.191A1.76 1.76 0 0021 6.096V6c0-.115-.022-.23-.064-.338a.98.98 0 00-.936-.662H15c-.552 0-1-.448-1-1s.448-1 1-1h1.382a2 2 0 001.789-1.106l.53.1-.53-.1z" /></svg>;
    case 'development': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
    case 'ecosystem': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>;
    case 'newsletter': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    case 'social': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
    default: return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
  }
}

const ALL_ID = '__all__';

export function VBlogSidebar({
  articles,
  selectedCategory,
  selectedTags,
  searchQuery,
  onCategoryChange,
  onTagToggle,
  onSearchChange,
  onCreateArticle,
  activeView = 'explore',
}: VBlogSidebarProps) {
  const categories = Array.from(new Set(articles.map((a) => a.category))).sort();
  const allTags = Array.from(new Set(articles.flatMap((a) => a.tags))).sort();

  const categoryItems = [
    { id: ALL_ID, label: 'All Categories', count: articles.length, icon: <VBlogCategoryIcon id={null} /> },
    ...categories.map((c) => ({
      id: c,
      label: c,
      count: articles.filter((a) => a.category === c).length,
      icon: <VBlogCategoryIcon id={c} />,
    })),
  ];

  const handleCategorySelect = (id: string) => {
    onCategoryChange(id === ALL_ID ? null : id);
  };

  const header = (onHide: () => void) => (
    <div className="flex-shrink-0 bg-transparent border-b border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/hub"
          className="text-zinc-500 dark:text-zinc-400 hover:text-[#02abb8] font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors group"
        >
          <svg className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Hub
        </Link>
        <button type="button" onClick={onHide} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors" aria-label="Hide sidebar">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
      </div>
      <div className="k-search-container">
        <svg className="k-search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="text" placeholder="Search articles..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="k-search-input !h-9 !pl-9" />
      </div>
    </div>
  );

  return (
    <UnifiedSidebar storageKeyPrefix="vblog" header={header}>
      <div className="p-4">
        {onCreateArticle && (
          <div className="mb-6">
            <button type="button" onClick={onCreateArticle} className="w-full flex items-center gap-3 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl transition-all shadow-lg shadow-orange-500/20 group">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-left">Create Article</span>
            </button>
          </div>
        )}
        <div className="mb-6 space-y-0.5">
          <SidebarNavItem href="/vblog/dashboard" label="Author Dashboard" active={activeView === 'dashboard'} icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
          <SidebarNavItem href="/vblog" label="Explore Articles" active={activeView === 'explore'} icon={<svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>} />
        </div>
        <SidebarCategories
          title="Categories"
          items={categoryItems}
          selectedIds={selectedCategory == null ? ALL_ID : selectedCategory}
          onSelect={handleCategorySelect}
          multi={false}
        />
        {allTags.length > 0 && <SidebarTags title="Tags" tags={allTags} selectedTags={selectedTags} onToggle={onTagToggle} />}
        {(selectedCategory !== null || selectedTags.length > 0 || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              onCategoryChange(null);
              onSearchChange('');
              selectedTags.forEach((tag) => onTagToggle(tag));
            }}
            className="w-full mt-4 k-control-btn"
          >
            Clear All Filters
          </button>
        )}
      </div>
    </UnifiedSidebar>
  );
}

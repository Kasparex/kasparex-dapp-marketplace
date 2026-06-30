'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { VBlogArticle } from '@/lib/vblog/types';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarCategories } from '@/components/sidebar/SidebarCategories';
import { SidebarTags } from '@/components/sidebar/SidebarTags';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import { getVBlogCategoriesFromArticles } from '@/lib/vblog/categories';

export type VBlogDashboardNavTarget = {
  section: 'create' | 'pricing' | 'modules' | 'archive';
  category?: string | null;
};

interface VBlogSidebarProps {
  articles: VBlogArticle[];
  selectedCategory: string | null;
  selectedTags?: string[];
  searchQuery: string;
  onCategoryChange: (category: string | null) => void;
  onTagToggle?: (tag: string) => void;
  onSearchChange: (query: string) => void;
  activeView?: 'explore' | 'dashboard' | 'vault' | 'article';
  articleNavItems?: Array<{ id: string; label: string; icon?: ReactNode; count?: number | string }>;
  onArticleNavClick?: (itemId: string) => void;
  onDashboardNav?: (target: VBlogDashboardNavTarget) => void;
  dashboardAuthorArticles?: VBlogArticle[];
  defaultHidden?: boolean;
}

const SIDEBAR_BTN_ICON = 'w-4 h-4 shrink-0 text-zinc-800 dark:text-zinc-200';
const SIDEBAR_BTN_ICON_ACTIVE = `${SIDEBAR_BTN_ICON} !text-white`;

function VBlogCategoryIcon({ id, className = '' }: { id: string | null; className?: string }) {
  const iconProps = {
    className: `k-sidebar-icon text-zinc-800 dark:text-zinc-200 ${className}`,
    strokeWidth: 2,
    fill: 'none' as const,
    viewBox: '0 0 24 24',
    stroke: 'currentColor' as const,
  };
  if (!id)
    return (
      <svg {...iconProps}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    );
  switch (id.toLowerCase()) {
    case 'announcement':
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A1.76 1.76 0 015 15.066V15c0 .115.022.23.064.338a.98.98 0 00.936.662H9c.552 0 1 .448 1 1s-.448 1-1 1H7.618a2 2 0 01-1.789-1.106l-.53-.1.53.1zm14.11-6.191A1.76 1.76 0 0021 6.096V6c0-.115-.022-.23-.064-.338a.98.98 0 00-.936-.662H15c-.552 0-1-.448-1-1s.448-1 1-1h1.382a2 2 0 001.789-1.106l.53.1-.53-.1z"
          />
        </svg>
      );
    case 'development':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    case 'ecosystem':
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
      );
    case 'newsletter':
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      );
    case 'social':
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      );
    case 'tutorial':
    case 'tutorials':
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.377 13.12L4.5 21l7.5-2.88L19.5 21l-2.877-7.88"
          />
        </svg>
      );
    case 'guide':
    case 'guides':
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case 'update':
    case 'updates':
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      );
    case 'tech':
    case 'technology':
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      );
    case 'product':
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      );
    case 'events':
    case 'event':
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    default:
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      );
  }
}

const ALL_ID = '__all__';

const DASHBOARD_SECTIONS: Array<{ id: VBlogDashboardNavTarget['section']; label: string; anchor: string }> = [
  { id: 'create', label: 'Create article', anchor: 'vblog-dashboard-create' },
  { id: 'pricing', label: 'Fees & rewards', anchor: 'vblog-dashboard-pricing' },
  { id: 'modules', label: 'Premium modules', anchor: 'vblog-dashboard-modules' },
  { id: 'archive', label: 'Personal archive', anchor: 'vblog-dashboard-archive' },
];

function scrollToAnchor(anchorId: string) {
  if (typeof window === 'undefined') return;
  window.requestAnimationFrame(() => {
    document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function VBlogSidebar({
  articles,
  selectedCategory,
  selectedTags = [],
  searchQuery,
  onCategoryChange,
  onTagToggle,
  onSearchChange,
  activeView = 'explore',
  articleNavItems = [],
  onArticleNavClick,
  onDashboardNav,
  dashboardAuthorArticles = [],
  defaultHidden = false,
}: VBlogSidebarProps) {
  const categories = getVBlogCategoriesFromArticles(articles);
  const allTags = Array.from(new Set(articles.flatMap((a) => a.tags))).sort();

  const categoryItems = [
    { id: ALL_ID, label: 'All Articles', count: articles.length, icon: <VBlogCategoryIcon id={null} /> },
    ...categories.map((c) => ({
      id: c,
      label: c,
      count: articles.filter((a) => a.category === c).length,
      icon: <VBlogCategoryIcon id={c} />,
    })),
  ];

  const dashboardArchiveCategoryItems = [
    {
      id: ALL_ID,
      label: 'All articles',
      count: dashboardAuthorArticles.length,
      icon: <VBlogCategoryIcon id={null} />,
    },
    ...Array.from(new Set(dashboardAuthorArticles.map((article) => article.category)))
      .sort((a, b) => a.localeCompare(b))
      .map((category) => ({
        id: category,
        label: category,
        count: dashboardAuthorArticles.filter((article) => article.category === category).length,
        icon: <VBlogCategoryIcon id={category} />,
      })),
  ];

  const handleCategorySelect = (id: string) => {
    if (activeView === 'dashboard') {
      if (id === ALL_ID) {
        onDashboardNav?.({ section: 'archive', category: null });
      } else {
        onDashboardNav?.({ section: 'archive', category: id });
      }
      scrollToAnchor('vblog-dashboard-archive');
      return;
    }
    onCategoryChange(id === ALL_ID ? null : id);
  };

  const handleDashboardSectionNav = (section: VBlogDashboardNavTarget['section'], anchor: string) => {
    onDashboardNav?.({ section, category: section === 'archive' ? selectedCategory : null });
    scrollToAnchor(anchor);
  };

  const backHref = activeView === 'article' ? '/vblog' : activeView === 'explore' ? '/hub' : '/vblog';
  const backLabel = activeView === 'explore' ? 'Back to hub' : 'Back to vBlog';
  const header = (onHide: () => void) => (
    <SidebarHeader backHref={backHref} backLabel={backLabel} onHide={onHide} />
  );

  const dashboardActive = activeView === 'dashboard';
  const vaultActive = activeView === 'vault';
  const [articleSidebarHidden, setArticleSidebarHidden] = useState(defaultHidden);

  useEffect(() => {
    if (activeView === 'article') {
      setArticleSidebarHidden(defaultHidden);
    }
  }, [activeView, defaultHidden]);

  return (
    <UnifiedSidebar
      storageKeyPrefix="vblog"
      header={header}
      isHidden={activeView === 'article' ? articleSidebarHidden : undefined}
      onHiddenChange={activeView === 'article' ? setArticleSidebarHidden : undefined}
    >
      <div className="mb-6 space-y-2">
        <Link
          href="/vblog/dashboard"
          className={`k-control-btn w-full justify-center gap-2 ${dashboardActive ? '!bg-cyan-600 !text-white' : ''}`}
        >
          <svg className={dashboardActive ? SIDEBAR_BTN_ICON_ACTIVE : SIDEBAR_BTN_ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Author Dashboard
        </Link>
        <Link
          href="/vblog/vault"
          className={`k-control-btn w-full justify-center gap-2 ${vaultActive ? '!bg-cyan-600 !text-white' : ''}`}
        >
          <svg className={vaultActive ? SIDEBAR_BTN_ICON_ACTIVE : SIDEBAR_BTN_ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Vault & Unlocks
        </Link>
      </div>
      {activeView === 'article' ? (
        <SidebarSection title="Article navigation">
          <nav className="space-y-0.5">
            {articleNavItems.map((item) => (
              <SidebarNavItem
                key={item.id}
                href={onArticleNavClick ? undefined : `#${item.id}`}
                onClick={
                  onArticleNavClick
                    ? () => onArticleNavClick(item.id)
                    : undefined
                }
                onLinkClick={
                  onArticleNavClick
                    ? (e) => {
                        e.preventDefault();
                        onArticleNavClick(item.id);
                      }
                    : undefined
                }
                label={item.label}
                count={item.count}
                icon={
                  item.icon ?? (
                    <svg className="w-4 h-4 k-sidebar-icon text-zinc-800 dark:text-zinc-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-6 4h10" />
                    </svg>
                  )
                }
              />
            ))}
          </nav>
        </SidebarSection>
      ) : activeView === 'dashboard' ? (
        <>
          <SidebarSection title="Page sections">
            <nav className="space-y-0.5">
              {DASHBOARD_SECTIONS.map((item) => (
                <SidebarNavItem
                  key={item.id}
                  href={`#${item.anchor}`}
                  onLinkClick={(e) => {
                    e.preventDefault();
                    handleDashboardSectionNav(item.id, item.anchor);
                  }}
                  label={item.label}
                  icon={<VBlogCategoryIcon id={item.id === 'archive' ? 'guide' : item.id === 'pricing' ? 'product' : item.id === 'modules' ? 'subscription' : 'tutorial'} />}
                />
              ))}
            </nav>
          </SidebarSection>
          <SidebarCategories
            title="Archive categories"
            items={dashboardArchiveCategoryItems}
            selectedIds={selectedCategory == null ? ALL_ID : selectedCategory}
            onSelect={handleCategorySelect}
            multi={false}
            collapsedItemCount={5}
          />
        </>
      ) : (
        <>
          <SidebarCategories
            title="Categories"
            items={categoryItems}
            selectedIds={selectedCategory == null ? ALL_ID : selectedCategory}
            onSelect={handleCategorySelect}
            multi={false}
            collapsedItemCount={5}
          />
          {allTags.length > 0 && onTagToggle ? (
            <SidebarTags title="Tags" tags={allTags} selectedTags={selectedTags} onToggle={onTagToggle} />
          ) : null}
          {(selectedCategory !== null || selectedTags.length > 0 || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                onCategoryChange(null);
                onSearchChange('');
                if (onTagToggle) {
                  selectedTags.forEach((tag) => onTagToggle(tag));
                }
              }}
              className="w-full mt-4 k-control-btn"
            >
              Clear All Filters
            </button>
          )}
        </>
      )}
    </UnifiedSidebar>
  );
}

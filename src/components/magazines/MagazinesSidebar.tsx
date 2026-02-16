'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Magazine, MagazineIssue } from '@/lib/magazines/types';
import { UnifiedSidebar } from '../UnifiedSidebar';
import { SidebarHeader } from '../sidebar/SidebarHeader';
import { SidebarSection } from '../sidebar/SidebarSection';
import { SidebarQuickActions } from '../sidebar/SidebarQuickActions';
import { SidebarCategories } from '../sidebar/SidebarCategories';
import { SidebarTags } from '../sidebar/SidebarTags';
import { SidebarNavItem } from '../sidebar/SidebarNavItem';

interface MagazinesSidebarProps {
  mode: 'listing' | 'issue' | 'utility';
  categories?: string[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  categoryCounts?: Record<string, number>;
  tags?: string[];
  selectedTags?: string[];
  onTagToggle?: (tag: string) => void;
  currentMagazine?: Magazine;
  issues?: MagazineIssue[];
  currentIssueId?: string;
}

const quickActionsListing = [
  { id: 'dashboard', label: 'My Dashboard', href: '/magazines/dashboard', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
  { id: 'create', label: 'Create Issue', href: '/magazines/editor', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg> },
  { id: 'explore', label: 'Explore Magazines', href: '/magazines', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> },
];

function MagazineCategoryIcon({ category, className = '' }: { category: string; className?: string }) {
  const iconProps = { className: `w-4 h-4 ${className}`, strokeWidth: 2, fill: 'none' as const, viewBox: '0 0 24 24', stroke: 'currentColor' as const };
  const c = category.toLowerCase();
  if (c === 'all') return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
  if (c === 'technical' || c === 'tech') return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
  if (c === 'community') return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
  if (c === 'history') return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  if (c === 'guide' || c === 'guides') return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.247 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
  if (c === 'news' || c === 'newsletter') return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>;
  if (c === 'research') return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
  return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" /></svg>;
}

const issueIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.247 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;

export function MagazinesSidebar({
  mode,
  categories = [],
  selectedCategory = 'All',
  onCategoryChange,
  categoryCounts,
  tags = [],
  selectedTags = [],
  onTagToggle,
  currentMagazine,
  issues = [],
  currentIssueId,
}: MagazinesSidebarProps) {
  const pathname = usePathname();
  const isListing = mode === 'listing';
  const isIssue = mode === 'issue';
  const isUtility = mode === 'utility';

  const backHref = isUtility || !pathname.startsWith('/magazines') ? '/magazines' : '/hub';
  const backLabel = isUtility || !pathname.startsWith('/magazines') ? 'Back to Magazines' : 'Back to Hub';

  const categoryItems = categories.map((cat) => ({
    id: cat,
    label: cat,
    count: categoryCounts?.[cat] ?? undefined,
    icon: <MagazineCategoryIcon category={cat} />,
  }));

  const magazinesFooter = (
    <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
      <div className="w-8 h-8 rounded-xl bg-[#02abb8]/10 text-[#02abb8] flex items-center justify-center font-black text-[10px]">KM</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest truncate">Kasparex Mag</p>
        <p className="text-[9px] font-bold text-zinc-500 uppercase">Publishing Suite</p>
      </div>
    </div>
  );

  return (
    <UnifiedSidebar
      storageKeyPrefix="magazines"
      header={(onHide) => <SidebarHeader backHref={backHref} backLabel={backLabel} onHide={onHide} className="bg-white dark:bg-zinc-950" />}
      footer={magazinesFooter}
    >
      <SidebarQuickActions items={quickActionsListing} />

      {isListing && categories.length > 0 && (
        <SidebarCategories
          title="Categories"
          items={categoryItems}
          selectedIds={selectedCategory}
          onSelect={(id) => onCategoryChange?.(id)}
          multi={false}
        />
      )}

      {isListing && tags.length > 0 && (
        <SidebarTags tags={tags} selectedTags={selectedTags} onToggle={(tag) => onTagToggle?.(tag)} title="Popular Tags" />
      )}

      {isIssue && currentMagazine && issues.length > 0 && (
        <SidebarSection title="Magazine Issues">
          <div className="px-1 mb-4">
            <p className="text-[10px] font-bold text-zinc-400 mb-2 truncate italic px-1">{currentMagazine.name}</p>
          </div>
          <nav className="space-y-0.5">
            {issues.map((issue) => (
              <Link
                key={issue.id}
                href={`/magazines/${currentMagazine.slug}/${issue.issueNumber}`}
                className="block"
              >
                <SidebarNavItem
                  label={issue.title}
                  icon={issueIcon}
                  count={`#${issue.issueNumber}`}
                  active={currentIssueId === issue.id}
                />
              </Link>
            ))}
          </nav>
        </SidebarSection>
      )}
    </UnifiedSidebar>
  );
}

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
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
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
];

const categoryIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>;
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
    icon: categoryIcon,
  }));

  const magazinesFooter = (
    <div className="flex items-center gap-3 p-4">
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
      {(isListing || isUtility) && (
        <SidebarQuickActions items={quickActionsListing} sectionIcon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
      )}

      {isListing && categories.length > 0 && (
        <SidebarCategories
          title="Categories"
          sectionIcon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>}
          items={categoryItems}
          selectedIds={selectedCategory}
          onSelect={(id) => onCategoryChange?.(id)}
          multi={false}
        />
      )}

      {isListing && tags.length > 0 && (
        <SidebarTags tags={tags} selectedTags={selectedTags} onToggle={(tag) => onTagToggle?.(tag)} title="Popular Tags" sectionIcon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>} />
      )}

      {isIssue && currentMagazine && issues.length > 0 && (
        <SidebarSection title="Magazine Issues" icon={issueIcon}>
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

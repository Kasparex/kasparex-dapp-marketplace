'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Magazine, MagazineIssue } from '@/lib/magazines/types';
import { UnifiedSidebar } from '../UnifiedSidebar';
import { SidebarHeader } from '../sidebar/SidebarHeader';
import { SidebarSection } from '../sidebar/SidebarSection';
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

const SIDEBAR_BTN_ICON = 'w-3.5 h-3.5';
const SIDEBAR_BTN_ICON_ACTIVE = 'w-3.5 h-3.5 text-white';

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
  if (c === 'ecosystem') return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>;
  if (c === 'technology') return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
  if (c === 'krc20' || c === 'krc-20') return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  if (c === 'art' || c === 'culture') return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
  if (c === 'science') return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
  if (c === 'business') return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
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
  const dashboardActive = pathname?.startsWith('/magazines/dashboard') ?? false;
  const editorActive = pathname?.startsWith('/magazines/editor') ?? false;

  const categoryItems = categories.map((cat) => ({
    id: cat,
    label: cat,
    count: categoryCounts?.[cat] ?? undefined,
    icon: <MagazineCategoryIcon category={cat} />,
  }));

  return (
    <UnifiedSidebar
      storageKeyPrefix="magazines"
      header={(onHide) => <SidebarHeader backHref="/hub" backLabel="Back to Hub" onHide={onHide} />}
    >
      <div className="mb-6 space-y-2 px-1">
        <Link
          href="/magazines/dashboard"
          className={`k-control-btn hub-cta-btn w-full justify-center gap-2 ${
            dashboardActive ? 'hub-sidebar-action-active' : ''
          }`}
        >
          <svg className={dashboardActive ? SIDEBAR_BTN_ICON_ACTIVE : SIDEBAR_BTN_ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Creator Dashboard
        </Link>
        <Link
          href="/magazines/editor"
          className={`k-control-btn hub-cta-btn w-full justify-center gap-2 ${
            editorActive ? 'hub-sidebar-action-active' : ''
          }`}
        >
          <svg className={editorActive ? SIDEBAR_BTN_ICON_ACTIVE : SIDEBAR_BTN_ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Issue
        </Link>
      </div>

      {editorActive ? (
        <SidebarSection title="On this page">
          <nav className="space-y-1">
            <SidebarNavItem
              label="Issue form"
              active
              onClick={() => document.getElementById('magazines-dashboard-create')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            />
            <SidebarNavItem
              label="Fees & rewards"
              onClick={() => document.getElementById('magazines-dashboard-pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            />
            <SidebarNavItem
              label="Premium modules"
              onClick={() => document.getElementById('magazines-dashboard-modules')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            />
          </nav>
        </SidebarSection>
      ) : null}

      {isListing && categories.length > 0 && (
        <SidebarCategories
          title="Categories"
          items={categoryItems}
          selectedIds={selectedCategory}
          onSelect={(id) => onCategoryChange?.(id)}
          multi={false}
          collapsedItemCount={5}
        />
      )}

      {isListing && tags.length > 0 && (
        <SidebarTags tags={tags} selectedTags={selectedTags} onToggle={(tag) => onTagToggle?.(tag)} title="Popular Tags" />
      )}

      {isIssue && currentMagazine && issues.length > 0 && (
        <SidebarSection title="Magazine Issues">
          <div className="mb-4 px-1">
            <p className="mb-2 truncate px-1 text-[10px] font-bold italic text-zinc-400">{currentMagazine.name}</p>
          </div>
          <nav className="space-y-0.5">
            {issues.map((issue) => (
              <Link key={issue.id} href={`/magazines/${currentMagazine.slug}/${issue.issueNumber}`} className="block">
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

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';

const dashboardIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const bookIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const homeIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const usersIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const mapIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const truckIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const articleIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
);

const LORE_NAV_ITEMS = [
  { href: '/chronicles/chapters', label: 'Chapters', icon: bookIcon, match: (p: string) => p.startsWith('/chronicles/chapters') || p === '/chronicles' },
  { href: '/chronicles/overview', label: 'Overview', icon: homeIcon, match: (p: string) => p === '/chronicles/overview' },
  { href: '/chronicles/articles', label: 'Articles', icon: articleIcon, match: (p: string) => p.startsWith('/chronicles/articles') },
  { href: '/chronicles/characters', label: 'Characters', icon: usersIcon, match: (p: string) => p.startsWith('/chronicles/characters') },
  { href: '/chronicles/locations', label: 'Locations', icon: mapIcon, match: (p: string) => p.startsWith('/chronicles/locations') },
  { href: '/chronicles/vehicles', label: 'Vehicles & tech', icon: truckIcon, match: (p: string) => p.startsWith('/chronicles/vehicles') },
] as const;

export function ChroniclesSidebar() {
  const pathname = usePathname();

  const backHref = pathname.startsWith('/chronicles/chapters') && pathname === '/chronicles/chapters' ? '/hub' : '/chronicles/chapters';
  const backLabel = backHref === '/hub' ? 'Back to hub' : 'Back to chapters';

  return (
    <UnifiedSidebar
      storageKeyPrefix="chronicles"
      defaultWidth={292}
      header={(onHide) => (
        <SidebarHeader backHref={backHref} backLabel={backLabel} onHide={onHide} className="bg-white dark:bg-zinc-950" />
      )}
    >
      <SidebarSection title="Chronicles Panel">
        <nav className="space-y-1">
          <Link href="/chronicles/center">
            <SidebarNavItem
              label="Dashboard"
              icon={dashboardIcon}
              active={pathname.startsWith('/chronicles/center')}
            />
          </Link>
        </nav>
      </SidebarSection>

      <SidebarSection title="Krex's Chronicles" className="mt-4">
        <nav className="space-y-1">
          {LORE_NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              <SidebarNavItem label={item.label} icon={item.icon} active={item.match(pathname)} />
            </Link>
          ))}
        </nav>
      </SidebarSection>
    </UnifiedSidebar>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';

const homeIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const bookIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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

export function ChroniclesSidebar() {
  const pathname = usePathname();

  const isOverview = pathname === '/chronicles';
  const isChapters = pathname.startsWith('/chronicles/chapters');
  const isCharacters = pathname.startsWith('/chronicles/characters');
  const isLocations = pathname.startsWith('/chronicles/locations');
  const isVehicles = pathname.startsWith('/chronicles/vehicles');

  return (
    <UnifiedSidebar
      storageKeyPrefix="chronicles"
      header={(onHide) => (
        <SidebarHeader
          backHref="/hub"
          backLabel="Back to Hub"
          onHide={onHide}
          className="bg-white dark:bg-zinc-950"
        />
      )}
    >
      <SidebarSection title="Krex's Chronicles">
        <nav className="space-y-0.5">
          <Link href="/chronicles">
            <SidebarNavItem label="Overview" icon={homeIcon} active={isOverview} />
          </Link>
          <Link href="/chronicles/chapters">
            <SidebarNavItem label="Chapters" icon={bookIcon} active={isChapters} />
          </Link>
          <Link href="/chronicles/characters">
            <SidebarNavItem label="Characters" icon={usersIcon} active={isCharacters} />
          </Link>
          <Link href="/chronicles/locations">
            <SidebarNavItem label="Locations" icon={mapIcon} active={isLocations} />
          </Link>
          <Link href="/chronicles/vehicles">
            <SidebarNavItem label="Vehicles & tech" icon={truckIcon} active={isVehicles} />
          </Link>
        </nav>
      </SidebarSection>
    </UnifiedSidebar>
  );
}

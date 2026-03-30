'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { SidebarNavItem } from '@/components/sidebar/SidebarNavItem';
import { ChroniclesNavGroup, ChroniclesNavSublink } from '@/components/chronicles/ChroniclesNavGroup';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  getAllCharacters,
  getAllLocations,
  getAllVehicles,
  getChapterSummaries,
} from '@/lib/chronicles/loaders';
import storyFolderMap from '../../../data/chronicles/story-folder-map.json';

const WORKSPACE_FOLDER_KEYS = new Set([
  'Community_Posts',
  'KMAG',
  'Shared_Lore',
  'Shared_Media',
  'SmartContracts_Templates',
  'Template_Character',
  'vPROGS_SQUAD',
]);

function folderToLabel(folder: string) {
  return folder.replace(/_/g, ' ');
}

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

const folderIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const vaultIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const trophyIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 21h8m-4 0v-4m6-14h2a2 2 0 012 2v1a6 6 0 01-6 6M6 3H4a2 2 0 00-2 2v1a6 6 0 006 6m10-9H6v5a6 6 0 006 6 6 6 0 006-6V3z"
    />
  </svg>
);

const map = storyFolderMap as Record<string, string | null>;

export function ChroniclesSidebar() {
  const pathname = usePathname();

  const chapters = useMemo(() => getChapterSummaries(), []);
  const characters = useMemo(() => getAllCharacters().slice().sort((a, b) => a.name.localeCompare(b.name)), []);
  const locations = useMemo(() => getAllLocations().slice().sort((a, b) => a.name.localeCompare(b.name)), []);
  const vehicles = useMemo(() => getAllVehicles().slice().sort((a, b) => a.name.localeCompare(b.name)), []);

  const draftCharacterFolders = useMemo(() => {
    return Object.entries(map)
      .filter(([key, slug]) => slug === null && !WORKSPACE_FOLDER_KEYS.has(key))
      .map(([key]) => key)
      .sort((a, b) => a.localeCompare(b));
  }, []);

  const workspaceEntries = useMemo(() => {
    return Object.entries(map)
      .filter(([key, slug]) => slug === null && WORKSPACE_FOLDER_KEYS.has(key))
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  const isOverview = pathname === '/chronicles';
  const isDashboard = pathname.startsWith('/chronicles/dashboard');
  const isChapters = pathname.startsWith('/chronicles/chapters');
  const isCharacters = pathname.startsWith('/chronicles/characters');
  const isLocations = pathname.startsWith('/chronicles/locations');
  const isVehicles = pathname.startsWith('/chronicles/vehicles');

  const navLabelClass =
    'text-xs font-bold uppercase tracking-wide flex-1 min-w-0 leading-snug break-words line-clamp-2 text-left';

  const backHref = pathname === '/chronicles' ? '/hub' : '/chronicles';
  const backLabel = pathname === '/chronicles' ? '< back to hub' : '< back to chronicles';

  return (
    <UnifiedSidebar
      storageKeyPrefix="chronicles"
      defaultWidth={292}
      header={(onHide) => (
        <SidebarHeader
          backHref={backHref}
          backLabel={backLabel}
          onHide={onHide}
          className="bg-white dark:bg-zinc-950"
        />
      )}
    >
      <SidebarSection
        title="Krex's Chronicles"
        headingClassName="text-xs sm:text-sm font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.18em] mb-4 px-2"
      >
        <div className="px-1.5 mb-3 space-y-2">
          <Link
            href="/chronicles/leaderboard"
            className={`k-control-btn w-full justify-center gap-2 ${
              pathname.startsWith('/chronicles/leaderboard')
                ? '!border-amber-500/40 !bg-amber-500/15 !text-amber-800 dark:!text-amber-300'
                : '!border-amber-500/30 !bg-amber-500/10 !text-amber-800 dark:!text-amber-300 hover:!bg-amber-500/15'
            }`}
          >
            {trophyIcon}
            <span className="text-xs font-black uppercase tracking-widest">Leaderboard</span>
          </Link>
          <Link
            href="/chronicles/dashboard"
            className={`k-control-btn w-full justify-center gap-2 ${
              isDashboard ? '!border-emerald-500/35 !bg-emerald-500/10 !text-emerald-800 dark:!text-emerald-300' : ''
            }`}
          >
            {vaultIcon}
            <span className="text-xs font-black uppercase tracking-widest">Vault &amp; unlocks</span>
          </Link>
        </div>
        <nav className="space-y-1">
          <Tooltip content="Overview" side="right" align="start">
            <Link href="/chronicles">
              <SidebarNavItem label="Overview" icon={homeIcon} active={isOverview} labelClassName={navLabelClass} />
            </Link>
          </Tooltip>

          <ChroniclesNavGroup
            groupId="chapters"
            label="Chapters"
            icon={bookIcon}
            href="/chronicles/chapters"
            defaultOpen
            active={isChapters}
          >
            <Link href="/chronicles/chapters">
              <div className={`k-sidebar-item group ${pathname === '/chronicles/chapters' ? 'k-sidebar-item-active' : ''}`.trim()}>
                <span className="text-xs font-bold uppercase tracking-wide pl-6">All chapters</span>
              </div>
            </Link>
            {chapters.map((c) => (
              <ChroniclesNavSublink
                key={c.slug}
                href={`/chronicles/chapters/${c.slug}`}
                label={`${c.number}. ${c.title.replace(/^Chapter \d+:\s*/, '')}`}
                active={pathname === `/chronicles/chapters/${c.slug}`}
              />
            ))}
          </ChroniclesNavGroup>

          <ChroniclesNavGroup groupId="characters" label="Characters" icon={usersIcon} href="/chronicles/characters" active={isCharacters}>
            <Link href="/chronicles/characters">
              <div className={`k-sidebar-item group ${pathname === '/chronicles/characters' ? 'k-sidebar-item-active' : ''}`.trim()}>
                <span className="text-xs font-bold uppercase tracking-wide pl-6">All characters</span>
              </div>
            </Link>
            {characters.map((c) => (
              <ChroniclesNavSublink
                key={c.slug}
                href={`/chronicles/characters/${c.slug}`}
                label={c.name}
                active={pathname === `/chronicles/characters/${c.slug}`}
              />
            ))}
            {draftCharacterFolders.map((folder) => (
              <ChroniclesNavSublink key={folder} label={folderToLabel(folder)} draft />
            ))}
          </ChroniclesNavGroup>

          <ChroniclesNavGroup groupId="locations" label="Locations" icon={mapIcon} href="/chronicles/locations" active={isLocations}>
            <Link href="/chronicles/locations">
              <div className={`k-sidebar-item group ${pathname === '/chronicles/locations' ? 'k-sidebar-item-active' : ''}`.trim()}>
                <span className="text-xs font-bold uppercase tracking-wide pl-6">All locations</span>
              </div>
            </Link>
            {locations.map((l) => (
              <ChroniclesNavSublink
                key={l.slug}
                href={`/chronicles/locations/${l.slug}`}
                label={l.name}
                active={pathname === `/chronicles/locations/${l.slug}`}
              />
            ))}
          </ChroniclesNavGroup>

          <ChroniclesNavGroup groupId="vehicles" label="Vehicles & tech" icon={truckIcon} href="/chronicles/vehicles" active={isVehicles}>
            <Link href="/chronicles/vehicles">
              <div className={`k-sidebar-item group ${pathname === '/chronicles/vehicles' ? 'k-sidebar-item-active' : ''}`.trim()}>
                <span className="text-xs font-bold uppercase tracking-wide pl-6">All items</span>
              </div>
            </Link>
            {vehicles.map((v) => (
              <ChroniclesNavSublink
                key={v.slug}
                href={`/chronicles/vehicles/${v.slug}`}
                label={v.name}
                active={pathname === `/chronicles/vehicles/${v.slug}`}
              />
            ))}
          </ChroniclesNavGroup>

          <ChroniclesNavGroup groupId="workspace" label="Workspace (source)" icon={folderIcon} href="/chronicles/dashboard#workspace">
            {workspaceEntries.map(([folder]) => (
              <ChroniclesNavSublink
                key={folder}
                href="/chronicles/dashboard#workspace"
                label={folderToLabel(folder)}
                active={false}
              />
            ))}
          </ChroniclesNavGroup>
        </nav>
      </SidebarSection>
    </UnifiedSidebar>
  );
}

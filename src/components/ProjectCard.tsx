'use client';

import { useAccount } from 'wagmi';
import { HubProject } from '@/lib/hubProjects';
import { hubProjectListingAccent } from '@/lib/hub/hubProjectListingAccent';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { useKaspaWallet } from '@/lib/kaspa/context';

interface ProjectCardProps {
  project: HubProject;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const accent = hubProjectListingAccent(project.id);
  const { state: kaspaState } = useKaspaWallet();
  const { isConnected: isEvmConnected } = useAccount();

  const l1 = kaspaState.isConnected;
  const l2 = isEvmConnected;
  const both = l1 && l2;
  const any = l1 || l2;

  // Best-effort required network per section (keeps behavior consistent site-wide).
  // `either`: section is browseable but requires at least one wallet for meaningful actions.
  const required: 'L1' | 'L2' | 'either' =
    project.id === 'krex-chronicles' || project.id === 'kasparex-rewards' || project.id === 'kasparex-nft-tools'
      ? 'L1'
      : project.id === 'kasparex-dapps' || project.id === 'kasparex-donations'
        ? 'either'
        : 'L2';

  const isOpenable =
    both ||
    (required === 'either' ? any : required === 'L1' ? l1 : l2);

  const overlayTitle = required === 'L1' ? 'Requires Kaspa L1 wallet' : required === 'L2' ? 'Requires EVM L2 wallet' : 'Connect a wallet';
  const overlaySubtitle =
    required === 'L1'
      ? 'Connect your Kaspa (L1) wallet to open this section.'
      : required === 'L2'
        ? 'Connect your EVM (L2) wallet to open this section.'
        : 'Connect either an L1 or L2 wallet to open this section.';

  const getStatusBadge = () => {
    switch (project.status) {
      case 'demo':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
            Demo
          </span>
        );
      case 'beta':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded">
            Beta
          </span>
        );
      case 'coming-soon':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
            Coming Soon
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <KxListingCard
      href={isOpenable ? project.route : undefined}
      disabled={!isOpenable}
      accent={accent}
      className="relative flex flex-col min-h-0"
    >
      <KxListingCardMedia>
        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
          {project.category === 'Publishing' && (
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          )}
          {project.category === 'Media' && (
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          {(project.category === 'Finance' || project.category === 'Marketplace') && (
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {project.category === 'Utility' && (
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          )}
          {project.category === 'Ecosystem' && (
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          )}
          {project.category === 'NFTs' && (
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          {project.category === 'Infrastructure' && (
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          )}
          {project.category === 'Creator Tools' && (
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          )}
          {project.category === 'Entertainment' && (
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
      </KxListingCardMedia>

      <KxListingCardBody className="relative z-10 flex-1 min-h-0">
        {getStatusBadge() ? <div className="absolute top-4 right-4 z-10">{getStatusBadge()}</div> : null}

        <div className="mb-2 pr-24">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{project.name}</h3>
        </div>

        <div className="mb-3 flex-grow min-h-0">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">{project.description}</p>
        </div>

        <div className="mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
              {project.category}
            </span>
          </div>
        </div>
      </KxListingCardBody>

      {/* Network gate overlay (hover). */}
      {!isOpenable ? (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl border border-cyan-500/40 bg-white/75 dark:bg-zinc-950/70 px-6 py-6 opacity-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.14)] backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100"
          aria-hidden
        >
          <p className="text-center text-base sm:text-lg font-black uppercase tracking-[0.12em] text-zinc-900 dark:text-zinc-50 drop-shadow-sm">
            {overlayTitle}
          </p>
          <p className="mt-3 text-center text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-zinc-200/95 max-w-md mx-auto font-semibold">
            {overlaySubtitle}
          </p>
        </div>
      ) : null}
    </KxListingCard>
  );
}

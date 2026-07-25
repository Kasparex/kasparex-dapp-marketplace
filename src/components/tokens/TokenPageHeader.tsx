'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import type { Token } from '@/lib/tokens/types';
import { loadTokenFeaturedImageUrl } from '@/lib/tokens/metadata';
import { TokenLogo } from './TokenLogo';
import { KxListingFeaturedPlaceholder } from '@/components/kx/KxListingFeaturedPlaceholder';
import { tokenHasModule, DEFAULT_HIGHLIGHT_HALO_COLOR } from '@/lib/tokens/modules';
import { resolveTokenCreatorWallet } from '@/lib/tokens/creatorWallet';
import { formatAddress } from '@/lib/vblog/utils';
import { AuthorInline } from '@/components/ui/AuthorInline';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  GameDeckResourceRows,
  type GameDeckResource,
} from '@/components/games/panels/GameDeckPanel';
import { TokenVoteControls } from '@/components/tokens/TokenVoteControls';
import { TokenNetworkChips } from '@/components/tokens/TokenNetworkChips';
import {
  getNetworkChipShortLabel,
  getTokenNetworkEntries,
} from '@/lib/tokens/networks';
import type { TokenContentTab } from '@/lib/tokens/sections';

type TokenPageHeaderProps = {
  token: Token;
  /** Switch detail tabs from Token Deck quick actions. */
  onNavigateTab?: (tab: TokenContentTab) => void;
};

function formatTokenType(type: Token['type']): string {
  return type === 'global' ? 'Global' : 'Collab';
}

const MAX_HEADER_BADGES = 4;

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace('#', '').trim();
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => `${c}${c}`)
          .join('')
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return `rgba(2, 171, 184, ${alpha})`;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function TokenPageHeader({ token, onNavigateTab }: TokenPageHeaderProps) {
  const router = useRouter();
  const { state: kaspaState } = useKaspaWallet();
  const { isConnected } = useAccount();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const featuredImageUrl = loadTokenFeaturedImageUrl(token);
  const short = token.shortDescription?.trim() || token.description;
  const isWalletConnected = kaspaState.isConnected || isConnected;
  const isVerifiedDeveloper = Boolean(token.listing?.verified && isWalletConnected);
  const isHighlighted = tokenHasModule(token.paidModuleIds, 'highlighted_profile');
  const highlightConfig = token.modulesConfig?.highlightedProfile;
  const haloColor = highlightConfig?.haloColor?.trim() || DEFAULT_HIGHLIGHT_HALO_COLOR;
  const badgePlacement = highlightConfig?.badgePlacement ?? 'below-title';
  const creatorWallet = resolveTokenCreatorWallet(token);
  const networkEntries = getTokenNetworkEntries(token);
  const primaryNetwork = networkEntries.find((e) => e.primary) ?? networkEntries[0];

  const deckResources = useMemo((): GameDeckResource[] => {
    const rows: GameDeckResource[] = [];

    if (primaryNetwork) {
      rows.push({
        id: 'network',
        label: 'Primary network',
        value: getNetworkChipShortLabel(primaryNetwork.network),
        description: primaryNetwork.verified ? 'Verified on-chain' : 'Listed',
        tooltip: 'Primary deployment network for this token listing.',
        accent: 'diamonds',
      });
    }

    if (token.price?.current != null) {
      rows.push({
        id: 'price',
        label: 'Price',
        value: `$${token.price.current.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })}`,
        subValue:
          token.price.change24h != null
            ? `${token.price.change24h >= 0 ? '+' : ''}${token.price.change24h.toFixed(2)}% 24h`
            : undefined,
        tooltip: 'Latest market price snapshot when available.',
        accent: 'kas',
        onClick: onNavigateTab ? () => onNavigateTab('markets') : undefined,
      });
    }

    rows.push({
      id: 'markets',
      label: 'Markets',
      value: 'Open',
      description: 'Charts & liquidity',
      tooltip: 'Jump to the Markets tab for price, minting progress, and balances.',
      onClick: onNavigateTab ? () => onNavigateTab('markets') : undefined,
    });

    if (token.whitepaperUrl || token.links?.some((l) => l.type === 'whitepaper')) {
      rows.push({
        id: 'whitepaper',
        label: 'Whitepaper',
        value: 'View',
        description: 'Docs & research',
        tooltip: 'Open the Overview whitepaper section for this token.',
        onClick: onNavigateTab
          ? () => {
              onNavigateTab('overview');
              window.setTimeout(() => {
                document.getElementById('token-whitepaper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 80);
            }
          : undefined,
      });
    }

    return rows.slice(0, 5);
  }, [token, primaryNetwork, onNavigateTab]);

  const badges: { key: string; label: string; tone?: 'accent' | 'player' | 'default' }[] = [
    {
      key: 'status',
      label: token.listing?.verified ? 'Verified' : token.assetKind === 'fictional' ? 'Community' : 'Listed',
      tone: 'accent',
    },
    { key: 'type', label: formatTokenType(token.type) },
  ];
  if (token.listing?.featured) {
    badges.push({ key: 'featured', label: 'Featured', tone: 'player' });
  }
  for (const tag of token.tags ?? []) {
    if (badges.length >= MAX_HEADER_BADGES) break;
    badges.push({ key: `tag-${tag}`, label: `#${tag}` });
  }

  const handleEdit = () => {
    router.push(`/tokens/dashboard?edit=${encodeURIComponent(token.slug)}`);
  };

  const badgeNodes = badges.slice(0, MAX_HEADER_BADGES).map((b) => {
    const tone = b.tone ?? 'default';
    const className =
      tone === 'player'
        ? 'rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-800 dark:text-cyan-200'
        : tone === 'accent'
          ? 'rounded-lg border border-[color:var(--hub-accent-border)] bg-[color:var(--hub-accent-muted)] px-3 py-1.5 text-xs font-medium text-[color:var(--hub-accent)]'
          : 'rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300';
    return (
      <span key={b.key} className={className}>
        {b.label}
      </span>
    );
  });

  const badgesRow = (
    <div className="flex min-w-0 flex-wrap gap-2">{badgeNodes}</div>
  );

  return (
    <div
      id="token-header"
      className={`relative mb-10 scroll-mt-24 overflow-hidden rounded-2xl border bg-white select-text dark:bg-zinc-900 ${
        isHighlighted ? '' : 'border-zinc-200 dark:border-zinc-800'
      }`}
      style={
        isHighlighted
          ? {
              borderColor: hexToRgba(haloColor, 0.6),
              boxShadow: `0 0 40px -12px ${hexToRgba(haloColor, 0.45)}`,
            }
          : undefined
      }
    >
      <div
        className="absolute inset-0 bg-gradient-to-br via-transparent to-transparent"
        style={{
          backgroundImage: isHighlighted
            ? `linear-gradient(to bottom right, ${hexToRgba(haloColor, 0.12)}, transparent, transparent)`
            : undefined,
        }}
      />
      {!isHighlighted ? (
        <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--hub-accent-muted)] via-transparent to-transparent" />
      ) : null}

      <div className="relative flex min-h-[360px] flex-col lg:flex-row">
        <div className="relative flex w-full flex-1 flex-col p-6 sm:p-8 lg:w-1/2 lg:p-10">
          <div
            className={`absolute z-10 ${
              badgePlacement === 'top-left'
                ? 'left-6 top-6 sm:left-8 sm:top-8 lg:left-10 lg:top-10'
                : 'right-6 top-6 sm:right-8 sm:top-8 lg:right-10 lg:top-10'
            }`}
          >
            <div className="flex flex-col items-end gap-2">
              {isHighlighted && badgePlacement === 'top-right' ? badgesRow : null}
              {isHighlighted && badgePlacement === 'top-left' ? (
                <div className="flex flex-col items-start gap-2">
                  {badgesRow}
                  <TokenNetworkChips token={token} className="justify-start" />
                </div>
              ) : (
                <TokenNetworkChips token={token} className="justify-end" />
              )}
            </div>
          </div>

          <div
            className={`mb-3 flex items-center gap-3 ${
              badgePlacement === 'top-left' ? 'pr-8' : 'pr-28'
            }`}
          >
            <TokenLogo token={token} size={40} showName={false} showSymbol={false} shape="rounded" className="flex-shrink-0" />
            <span className="hub-tilt-bar h-7 w-1.5 shrink-0 rounded-full" aria-hidden="true" />
            <h1 className="min-w-0 text-3xl font-black leading-tight tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              {token.name}
            </h1>
          </div>

          {creatorWallet ? (
            <AuthorInline
              address={creatorWallet}
              displayName={formatAddress(creatorWallet)}
              href={`/u/${encodeURIComponent(creatorWallet)}`}
              className="mb-4"
            />
          ) : null}

          <div className="mb-5 flex items-center justify-between gap-3">
            {!isHighlighted || badgePlacement === 'below-title' ? badgesRow : <div />}
            <div className="shrink-0">
              <TokenVoteControls token={token} compact />
            </div>
          </div>

          {short ? (
            <p id="token-intro" className="kx-body mb-4 line-clamp-3 max-w-2xl select-text">
              {short}
            </p>
          ) : null}

          {deckResources.length > 0 ? (
            <div className="mt-auto space-y-2 pt-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-zinc-500">Token Deck</p>
                <p className="text-xs font-medium text-zinc-400">Quick actions & snapshot</p>
              </div>
              <GameDeckResourceRows resources={deckResources} />
            </div>
          ) : null}
        </div>

        <div className="relative min-h-[220px] w-full border-t border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 lg:min-h-full lg:w-1/2 lg:border-l lg:border-t-0">
          <Tooltip
            content={
              <div className="space-y-1">
                <p className="font-bold text-zinc-900 dark:text-zinc-50">
                  {token.symbol} · {token.name}
                </p>
                {short ? (
                  <p className="text-xs leading-snug text-zinc-600 dark:text-zinc-300">{short}</p>
                ) : (
                  <p className="text-xs leading-snug text-zinc-500 dark:text-zinc-400">No intro description yet.</p>
                )}
              </div>
            }
            className="max-w-xs"
          >
            <div className="absolute inset-0 cursor-help">
              {featuredImageUrl ? (
                <Image
                  src={featuredImageUrl}
                  alt={token.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  unoptimized
                />
              ) : (
                <KxListingFeaturedPlaceholder className="min-h-[220px] lg:min-h-full" iconClassName="h-16 w-16" />
              )}
            </div>
          </Tooltip>

          {isVerifiedDeveloper ? (
            <div className="absolute right-4 top-4 z-30 flex items-center gap-2 sm:right-6 sm:top-6">
              <button
                type="button"
                onClick={handleEdit}
                className="rounded-xl border border-zinc-200 bg-white/90 p-2.5 text-zinc-900 backdrop-blur-md transition hover:scale-105 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-100"
                aria-label="Edit token page"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-xl bg-red-500 p-2.5 text-white transition hover:scale-105"
                aria-label="Delete token listing"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {showDeleteConfirm ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-zinc-900/50 p-4">
          <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <p className="mb-4 text-sm text-zinc-700 dark:text-zinc-300">
              Delete this token listing? On-chain removal will be available when publishing goes live.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="k-control-btn">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="k-control-btn !border-red-500/40 !text-red-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

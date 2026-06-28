'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { NFT_MULTIPLIER, NFT_FEE_REDUCTION, DIAMOND_NFT_MULTIPLIER, DIAMOND_NFT_FEE_REDUCTION, RAREST_NFT_MULTIPLIER, RAREST_NFT_FEE_REDUCTION } from '@/lib/rewards/types';
import { NFTBuyWizard } from './NFTBuyWizard';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { NFT_POINTS } from '@/lib/nft/points';
import { getPartnerCollections } from '@/lib/nft/collections';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';

export type NFTStatusBoxLayout = 'default' | 'compact-cards';

export function NFTStatusBox({
  layout = 'default',
  /** Sidebar compact: only KREXPRIME / PIXELKREX tiles (no partner mini-cards). */
  premiumCollectionsOnly = false,
  /** When provided, the dropdown can open the buy wizard outside its own subtree. */
  onOpenBuyWizard,
  /** When provided, NFT tiles can navigate to the NFT page. */
  onOpenNftPage,
}: {
  layout?: NFTStatusBoxLayout;
  premiumCollectionsOnly?: boolean;
  onOpenBuyWizard?: () => void;
  onOpenNftPage?: () => void;
}) {
  const { nftStatus, nftPoints, isLoading, error, refetch } = useNFTStatus();
  
  // Use real NFT status if available, otherwise use empty status
  const status = nftStatus || {
    hasKREXPRIME: false,
    hasPIXELKREX: false,
    hasDiamondKREXPRIME: false,
    hasDiamondPIXELKREX: false,
    hasRarestNFT: false,
    partnerCollections: {},
    partnerDiamonds: {},
  };
  
  const hasAnyNFT = Boolean(
    status.hasKREXPRIME ||
      status.hasPIXELKREX ||
      (status.partnerCollections && Object.values(status.partnerCollections).some((v) => v))
  );
  const hasAnyPremiumNFT = Boolean(status.hasKREXPRIME || status.hasPIXELKREX);
  const hasDiamondNFT = Boolean(
    status.hasDiamondKREXPRIME ||
      status.hasDiamondPIXELKREX ||
      (status.partnerDiamonds && Object.values(status.partnerDiamonds).some((v) => v))
  );
  const hasDiamondPremiumNFT = Boolean(status.hasDiamondKREXPRIME || status.hasDiamondPIXELKREX);
  const hasRarestNFT = Boolean(status.hasRarestNFT);
  const partnerCollections = getPartnerCollections();
  const [showModal, setShowModal] = useState(false);
  const [showBuyWizard, setShowBuyWizard] = useState(false);

  const rewardsModal =
    showModal && typeof window !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

            <div
              className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">NFT Rewards</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    KREXPRIME and PIXELKREX NFT holders unlock additional rewards
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">NFT Type</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          Reward Multiplier
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Fee Reduction</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                          🖼️ Regular NFT
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">(KREXPRIME or PIXELKREX)</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">+{NFT_MULTIPLIER}x</td>
                        <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">-{NFT_FEE_REDUCTION}%</td>
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">{NFT_POINTS.REGULAR} point</td>
                      </tr>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                          💎 Diamond NFT
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">(Any Diamond from any collection)</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">+{DIAMOND_NFT_MULTIPLIER}x</td>
                        <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">-{DIAMOND_NFT_FEE_REDUCTION}%</td>
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">{NFT_POINTS.DIAMOND} points</td>
                      </tr>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                          ⭐ Rarest NFT
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">(#515 PIXELKREX or #345 KREXPRIME)</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">+{RAREST_NFT_MULTIPLIER}x</td>
                        <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">-{RAREST_NFT_FEE_REDUCTION}% (Zero Fee)</td>
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">{NFT_POINTS.RAREST} points</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <button
                    className="px-6 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
                    onClick={() => {
                      console.log('Buy KREXPRIME clicked');
                    }}
                  >
                    Buy KREXPRIME
                  </button>
                  <button
                    className="px-6 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
                    onClick={() => {
                      console.log('Buy PIXELKREX clicked');
                    }}
                  >
                    Buy PIXELKREX
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  const buyWizard = onOpenBuyWizard ? null : (
    <NFTBuyWizard isOpen={showBuyWizard} onClose={() => setShowBuyWizard(false)} />
  );

  if (layout === 'compact-cards') {
    const compactAny = premiumCollectionsOnly ? hasAnyPremiumNFT : hasAnyNFT;
    const compactDiamond = premiumCollectionsOnly ? hasDiamondPremiumNFT : hasDiamondNFT;

    const miniCard = (
      label: string,
      ok: boolean,
      sub?: string,
      tooltip?: ReactNode,
      onClick?: () => void,
      okClass = 'text-green-600 dark:text-green-400'
    ) => {
      const tip =
        tooltip ??
        gameTooltipRich(
          label,
          ok ? 'We see holdings for your connected wallet.' : 'Not detected for your connected wallet.',
        );
      return (
        <Tooltip content={tip}>
        <div
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
          onClick={onClick}
          onKeyDown={
            onClick
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') onClick();
                }
              : undefined
          }
          className={[
            'rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/90 dark:bg-zinc-900/70 px-2.5 py-2 min-h-[56px] flex flex-col justify-center',
            onClick ? 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors' : '',
          ].join(' ')}
        >
          <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 truncate">
            {label}
          </div>
          <div className={`text-[12px] font-semibold leading-tight ${ok ? okClass : 'text-zinc-500 dark:text-zinc-500'}`}>
            {ok ? '✓ Held' : '-'}
          </div>
          {sub ? <div className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate">{sub}</div> : null}
        </div>
      </Tooltip>
      );
    };

    return (
      <>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">NFT status</h3>
            <div className="flex items-center gap-1 shrink-0">
              {isLoading ? (
                <span className="text-[10px] px-1.5 py-0.5 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 rounded font-bold">
                  Syncing
                </span>
              ) : compactAny ? (
                <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded font-bold">
                  Active
                </span>
              ) : null}
              <Tooltip content={gameTooltipRich('Refresh NFT status', 'Re-check holdings for your connected L1 wallet.')}>
                <button
                  type="button"
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded disabled:opacity-50"
                  onClick={() => void refetch()}
                  disabled={isLoading}
                  aria-label="Refresh NFT status"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </Tooltip>
              <Tooltip
                content={gameTooltipRich(
                  'NFT rewards',
                  'Tier multipliers, fee tweaks, and points at a glance.',
                )}
              >
                <button
                  type="button"
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
                  onClick={() => setShowModal(true)}
                  aria-label="View NFT rewards"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </Tooltip>
            </div>
          </div>

          {error ? (
            <p className="text-[10px] text-red-600 dark:text-red-400 leading-snug">{error}</p>
          ) : null}

          {isLoading ? (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 py-1">Loading…</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-1.5">
                {miniCard(
                  'KREXPRIME',
                  status.hasKREXPRIME,
                  undefined,
                  gameTooltipRich('KREXPRIME', 'Open the KREXPRIME collection on KaspaCom.'),
                  () => {
                    window.open('https://www.kaspa.com/nft/collections/KREXPRIME', '_blank', 'noopener,noreferrer');
                  },
                )}
                {miniCard(
                  'PIXELKREX',
                  status.hasPIXELKREX,
                  undefined,
                  gameTooltipRich('PIXELKREX', 'Open the PIXELKREX collection on KaspaCom.'),
                  () => {
                    window.open('https://www.kaspa.com/nft/collections/PIXELKREX', '_blank', 'noopener,noreferrer');
                  },
                )}
              </div>

              {!premiumCollectionsOnly && partnerCollections.length > 0 && status.partnerCollections ? (
                <div className="grid grid-cols-2 gap-1.5">
                  {partnerCollections.map((partnerColl) => {
                    const hasPartnerNFT = status.partnerCollections![partnerColl.id] || false;
                    const hasPartnerDiamond = status.partnerDiamonds?.[partnerColl.id] || false;
                    return (
                      <div key={partnerColl.id}>
                        {miniCard(
                          partnerColl.partnerName || partnerColl.name,
                          hasPartnerNFT,
                          hasPartnerNFT && hasPartnerDiamond ? '💎 Diamond' : undefined
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <div className="grid grid-cols-3 gap-1">
                {miniCard(
                  '🖼️',
                  compactAny,
                  undefined,
                  gameTooltipRich(
                    'Standard NFTs',
                    'Opens your NFT area when standard-tier NFTs are detected.',
                  ),
                  onOpenNftPage,
                  'text-blue-600 dark:text-blue-400',
                )}
                {miniCard(
                  '💎',
                  compactDiamond,
                  undefined,
                  gameTooltipRich(
                    'Diamond NFTs',
                    'Opens your NFT area when a diamond-tier NFT is detected.',
                  ),
                  onOpenNftPage,
                  'text-purple-600 dark:text-purple-400',
                )}
                {miniCard(
                  '⭐',
                  hasRarestNFT,
                  undefined,
                  gameTooltipRich(
                    'Rarest NFTs',
                    'Opens your NFT area when rarest-tier IDs are detected.',
                  ),
                  onOpenNftPage,
                  'text-yellow-600 dark:text-yellow-400',
                )}
              </div>

              {compactAny ? (
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-snug border-t border-zinc-200 dark:border-zinc-700 pt-1.5">
                  {hasRarestNFT ? (
                    <span className="text-yellow-600 dark:text-yellow-400 font-semibold">Top tier</span>
                  ) : compactDiamond ? (
                    <span className="text-purple-600 dark:text-purple-400 font-semibold">Diamond perks</span>
                  ) : (
                    <span className="text-green-600 dark:text-green-400 font-semibold">Holder perks</span>
                  )}
                  <span className="text-zinc-500 dark:text-zinc-500"> · +{nftPoints} pts</span>
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  if (onOpenBuyWizard) onOpenBuyWizard();
                  else setShowBuyWizard(true);
                }}
                className="w-full mt-2 px-3 py-2 text-xs font-bold text-center bg-[#02abb8] hover:bg-[#028a94] text-white rounded-xl transition-colors"
                aria-label="Buy or bridge NFTs"
              >
                Buy/Bridge NFTs
              </button>
            </>
          )}
        </div>
        {rewardsModal}
        {buyWizard}
      </>
    );
  }

  return (
    <>
      <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            NFT Status
          </h3>
          <div className="flex items-center gap-2">
            {hasAnyNFT && (
              <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                Active
              </span>
            )}
            <Tooltip
              content={gameTooltipRich(
                'NFT rewards',
                'Tier multipliers, fee tweaks, and points at a glance.',
              )}
            >
              <button
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                onClick={() => setShowModal(true)}
                aria-label="View NFT rewards"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </Tooltip>
          </div>
        </div>

      <div className="space-y-1.5">
        {isLoading && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 py-2">
            Loading NFT status...
          </div>
        )}
        {!isLoading && (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">KREXPRIME:</span>
              <span className={status.hasKREXPRIME ? 'text-green-600 dark:text-green-400 font-medium' : 'text-zinc-400'}>
                {status.hasKREXPRIME ? '✓ Owned' : 'Not owned'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">PIXELKREX:</span>
              <span className={status.hasPIXELKREX ? 'text-green-600 dark:text-green-400 font-medium' : 'text-zinc-400'}>
                {status.hasPIXELKREX ? '✓ Owned' : 'Not owned'}
              </span>
            </div>
          </>
        )}
        {/* Partner Collections */}
        {partnerCollections.length > 0 && status.partnerCollections && (
          <>
            {partnerCollections.map((partnerColl) => {
              const hasPartnerNFT = status.partnerCollections![partnerColl.id] || false;
              const hasPartnerDiamond = status.partnerDiamonds?.[partnerColl.id] || false;
              return (
                <div key={partnerColl.id} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {partnerColl.partnerName || partnerColl.name}:
                  </span>
                  <span className={hasPartnerNFT ? 'text-green-600 dark:text-green-400 font-medium' : 'text-zinc-400'}>
                    {hasPartnerNFT ? (
                      hasPartnerDiamond ? '✓ 💎 Diamond' : '✓ Owned'
                    ) : 'Not owned'}
                  </span>
                </div>
              );
            })}
          </>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">🖼️ Regular NFT:</span>
          <span className={hasAnyNFT ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-zinc-400'}>
            {hasAnyNFT ? '✓ Owned' : 'Not owned'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">💎 Diamond:</span>
          <span className={hasDiamondNFT ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-zinc-400'}>
            {hasDiamondNFT ? '✓ Owned' : 'Not owned'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">⭐ Rarest:</span>
          <span className={hasRarestNFT ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 'text-zinc-400'}>
            {hasRarestNFT ? '✓ Owned' : 'Not owned'}
          </span>
        </div>
        {hasAnyNFT && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-700 space-y-1">
            {hasRarestNFT ? (
              <div><span className="text-yellow-600 dark:text-yellow-400 font-medium">+5x multiplier, 0.0% fee, +{nftPoints} points</span></div>
            ) : hasDiamondNFT ? (
              <div><span className="text-purple-600 dark:text-purple-400 font-medium">+3x multiplier, -0.2% fee, +{nftPoints} points</span></div>
            ) : (
              <div><span className="text-green-600 dark:text-green-400 font-medium">+1x multiplier, -0.1% fee, +{nftPoints} points</span></div>
            )}
          </div>
        )}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setShowBuyWizard(true)}
            className="block w-full mt-2 px-3 py-2 text-xs font-medium text-center bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg transition-colors"
          >
            Buy or Bridge NFTs
          </button>
        </div>
      </div>
      </div>

      {rewardsModal}
      {buyWizard}
    </>
  );
}


'use client';

import { useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { kasToSompi } from '@/lib/ads/config';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { getVBlogTreasuryL1Address } from '@/lib/vblog/config';
import {
  getAuthorUnlockedModules,
  getVBlogModuleCombinedDiscountPercent,
  getVBlogModuleDiscountPercent,
  getVBlogModuleEffectivePriceKas,
  getVBlogModuleNftDiscountPercent,
  unlockAuthorModule,
  VBLOG_MODULE_OFFERS,
} from '@/lib/vblog/modules';
import { utf8ToHex } from '@/lib/vblog/payloadHex';
import type { VBlogModuleId } from '@/lib/vblog/types';

interface VBlogModuleUnlockCardsProps {
  title?: string;
  className?: string;
  onUnlockChange?: (ids: string[]) => void;
  recommendedModuleIds?: VBlogModuleId[];
  showToggleLabel?: string;
}

export function VBlogModuleUnlockCards({
  title = 'Unlock modules',
  className = '',
  onUnlockChange,
  recommendedModuleIds,
  showToggleLabel = 'Show all modules',
}: VBlogModuleUnlockCardsProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const [refreshTick, setRefreshTick] = useState(0);
  const [unlockingModuleId, setUnlockingModuleId] = useState<string | null>(null);
  const [showAllModules, setShowAllModules] = useState(false);
  const krexDiscountPct = getVBlogModuleDiscountPercent(tier);
  const nftDiscountPct = getVBlogModuleNftDiscountPercent(nftStatus);
  const combinedDiscountPct = getVBlogModuleCombinedDiscountPercent(tier, nftStatus);

  const unlocked = useMemo(() => {
    if (!kaspaState.address) return [];
    return getAuthorUnlockedModules(kaspaState.address);
  }, [kaspaState.address, refreshTick]);

  const cards = useMemo(() => {
    if (!recommendedModuleIds || recommendedModuleIds.length === 0 || showAllModules) {
      return VBLOG_MODULE_OFFERS;
    }
    const order = new Map(recommendedModuleIds.map((id, index) => [id, index]));
    return VBLOG_MODULE_OFFERS
      .filter((offer) => order.has(offer.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }, [recommendedModuleIds, showAllModules]);

  const handleUnlock = async (moduleId: VBlogModuleId, basePriceKas: number) => {
    if (!kaspaState.address || !kaspaState.provider || !kaspaState.isConnected) return;
    const effectiveKas = getVBlogModuleEffectivePriceKas(basePriceKas, tier, nftStatus);
    setUnlockingModuleId(moduleId);
    try {
      const note = `kvb1:module_unlock:${moduleId}:${Date.now()}`;
      const tx = await sendKaspaTransaction(kaspaState.provider as KaspaWalletProvider, {
        to: getVBlogTreasuryL1Address(),
        amount: String(kasToSompi(effectiveKas)),
        note,
        payload: utf8ToHex(note),
      });
      if (tx.status === 'failed' || !tx.txHash) {
        throw new Error(tx.error ?? 'Unlock transaction failed');
      }
      const txHash = extractKaspaTransactionId(tx.txHash) ?? tx.txHash;
      console.info('[vblog-module-unlock]', moduleId, txHash);
      const nextUnlocked = unlockAuthorModule(kaspaState.address, moduleId);
      setRefreshTick((x) => x + 1);
      onUnlockChange?.(nextUnlocked);
    } catch (err) {
      console.error(err);
    } finally {
      setUnlockingModuleId(null);
    }
  };

  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-black uppercase tracking-widest text-orange-600 dark:text-orange-300">{title}</p>
        <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
          KREX {tier} | Combined discount {combinedDiscountPct}%
        </span>
      </div>
      {recommendedModuleIds && recommendedModuleIds.length > 0 ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-semibold text-zinc-600 dark:text-zinc-400">
            {showAllModules ? 'Showing all unlock modules' : 'Showing recommended modules for this editor'}
          </p>
          <button
            type="button"
            onClick={() => setShowAllModules((x) => !x)}
            className="k-control-btn !py-1.5 !px-3 !text-[11px]"
          >
            {showAllModules ? 'Show recommended only' : showToggleLabel}
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((offer) => {
          const isUnlocked = unlocked.includes(offer.id);
          const isUnlocking = unlockingModuleId === offer.id;
          const effectiveKas = getVBlogModuleEffectivePriceKas(offer.unlockPriceKas, tier, nftStatus);
          const hasDiscount = effectiveKas < offer.unlockPriceKas;
          return (
            <div
              key={offer.id}
              className="rounded-2xl border border-orange-300/35 dark:border-orange-500/25 bg-white/95 dark:bg-zinc-900/70 overflow-hidden flex flex-col"
            >
              <div className="h-28 bg-gradient-to-br from-zinc-100 via-zinc-50 to-orange-500/10 dark:from-zinc-900 dark:via-zinc-950 dark:to-orange-950/35 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                {offer.featuredImage ? (
                  <img src={offer.featuredImage} alt={offer.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest">
                    <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Featured visual</span>
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-base font-black text-zinc-900 dark:text-zinc-100">{offer.title}</p>
                  {isUnlocked ? <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Unlocked</span> : null}
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 flex-1">{offer.description}</p>
                <div className="mt-3">
                  <div className="flex items-end gap-2">
                    <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">{effectiveKas} KAS</span>
                    {hasDiscount ? (
                      <span className="text-xs font-mono text-zinc-400 line-through">{offer.unlockPriceKas} KAS</span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                    {krexDiscountPct > 0 ? <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold">KREX -{krexDiscountPct}%</span> : null}
                    {nftDiscountPct > 0 ? <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/25 text-cyan-700 dark:text-cyan-300 font-bold">NFT -{nftDiscountPct}%</span> : null}
                    {krexDiscountPct === 0 && nftDiscountPct === 0 ? (
                      <span className="text-zinc-500 dark:text-zinc-400 font-semibold">No holder discounts on this wallet</span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isUnlocked || isUnlocking || !kaspaState.isConnected}
                  onClick={() => void handleUnlock(offer.id, offer.unlockPriceKas)}
                  className="mt-3 k-control-btn !bg-orange-500 hover:!bg-orange-600 !text-white !border-orange-400/30 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isUnlocked ? 'Unlocked' : isUnlocking ? 'Unlocking...' : `Unlock for ${effectiveKas} KAS`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!kaspaState.isConnected ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">Connect Kaspa wallet to unlock modules.</p>
      ) : null}
    </section>
  );
}


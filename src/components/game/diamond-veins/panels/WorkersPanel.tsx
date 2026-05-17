'use client';

import type { MiningSlot, TyconGameState } from '@/lib/game/engine';
import { nftDeckRoleLabel } from '@/lib/game/minecore/asset-usage';
import { computeMiningNftDeckDiamondBonusPer24h } from '@/lib/game/minecore/plant-economy';
import { getNFTTier } from '@/lib/game/diamond-bonuses';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { EmptyVeinSlotFrame, EmptyVeinSlotPlusIcon } from '@/components/game/EmptyVeinSlotFrame';
import type { ParsedNFTMetadata } from '@/lib/nft/metadata';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';
import * as Icons from 'lucide-react';
import { useGamesNftSlotsAdaptiveGrid } from '@/components/games/layout/GamesLayoutContext';

export function WorkersPanel({
  slots,
  slottedMetadata,
  automation,
  onSlotClick,
  onToggleAutoRestart,
  onClearSlot,
}: {
  slots: MiningSlot[];
  slottedMetadata: Record<number, ParsedNFTMetadata>;
  automation: TyconGameState['automation'];
  onSlotClick: (index: number) => void;
  onToggleAutoRestart: (enabled: boolean) => void;
  onClearSlot: (slotIndex: number) => void;
}) {
  const foremanReady = slots.some((s) => s.type === 'foreman' && s.nftId != null);
  const slotGridClass = useGamesNftSlotsAdaptiveGrid('gap-6');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Auto-restart mining runs
            <GameTooltip
              title="Auto-restart mining runs"
              description="When enabled, the server can restart your last mining run after it ends, up to your daily cap. Assign a Foreman (PIXELKREX) for a higher cap."
            >
              <button type="button" className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold dark:border-zinc-600">
                ?
              </button>
            </GameTooltip>
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Requires Foreman for best caps · syncs on save</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-400 text-emerald-600 focus:ring-emerald-500"
            checked={automation.autoRestartMiningRun}
            onChange={(e) => {
              const on = e.target.checked;
              if (on && !foremanReady) return;
              onToggleAutoRestart(on);
            }}
          />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Enabled</span>
        </label>
      </div>
      {!foremanReady && (
        <p className="text-xs text-amber-700 dark:text-amber-400">Assign a Foreman NFT below to unlock auto-restart policy (or keep it off).</p>
      )}

      <div className={slotGridClass}>
        {slots.map((slot, idx) => {
          const meta = slot.nftId !== null ? slottedMetadata[slot.nftId] : null;
          const tier = slot.nftId !== null && slot.collection ? getNFTTier(slot.collection, slot.nftId, meta) : null;
          const slotImageUrl = meta?.image ? getBestGatewayUrl(String(meta.image).replace('ipfs://', '')) : null;
          const roleLabel = nftDeckRoleLabel(slot.type);
          const bonusD24 = slot.nftId != null ? computeMiningNftDeckDiamondBonusPer24h(slot) : 0;
          return (
            <EmptyVeinSlotFrame key={idx} onClick={() => onSlotClick(idx)} frameClassName="aspect-square">
              <div className="relative flex h-full min-h-[200px] w-full flex-col items-center justify-center pt-9">
                <span className="absolute left-4 top-3 z-[1] rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-800 shadow-sm dark:bg-emerald-500/10 dark:text-emerald-300">
                  {roleLabel}
                </span>
                {slot.nftId != null ? (
                  <button
                    type="button"
                    className="absolute right-3 top-[2.85rem] z-[2] flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300/90 bg-white/95 text-zinc-600 shadow-sm transition-colors hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-600 dark:bg-zinc-900/95 dark:text-zinc-300 dark:hover:bg-rose-950/60 dark:hover:text-rose-300"
                    aria-label="Remove NFT from this slot"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearSlot(idx);
                    }}
                  >
                    <Icons.X className="h-4 w-4" />
                  </button>
                ) : null}

                {!slot.nftId ? (
                  <div className="flex flex-col items-center gap-4 px-2 text-center">
                    <EmptyVeinSlotPlusIcon />
                    <div>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {slot.type === 'worker' ? 'Deploy Premium or Partner' : 'Deploy PIXELKREX'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full flex-col items-center text-center">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-200 ring-2 ring-emerald-500/30 dark:bg-zinc-800">
                      {slotImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={slotImageUrl} alt={`#${slot.nftId}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">💎</div>
                      )}
                    </div>
                    <h3 className="mt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">#{slot.nftId}</h3>
                    {tier && tier !== 'regular' && (
                      <span className="mt-1 inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold uppercase text-amber-600 dark:text-amber-400">
                        {tier}
                      </span>
                    )}
                    <p className="mt-1.5 max-w-[14rem] text-[11px] font-semibold leading-snug text-sky-800 dark:text-sky-300">
                      +{bonusD24.toLocaleString()} D/day to plant cap (Minecore)
                      {slot.type === 'operator' ? ' · speed tier' : slot.type === 'foreman' ? ' · automation' : ''}
                    </p>
                    <p className="mt-2 text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-500">Locked · active</p>
                    <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">Click to manage · X clears</p>
                  </div>
                )}
              </div>
            </EmptyVeinSlotFrame>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import type { MiningSlot, TyconGameState } from '@/lib/game/engine';
import { getBonusForTrait, getNFTTier } from '@/lib/game/diamond-bonuses';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { EmptyVeinSlotFrame, EmptyVeinSlotPlusIcon } from '@/components/game/EmptyVeinSlotFrame';
import { WORKER_TIER_MULTIPLIERS, OPERATOR_TIER_MULTIPLIERS } from '@/lib/game/diamond-veins-config';
import type { ParsedNFTMetadata } from '@/lib/nft/metadata';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';

export function WorkersPanel({
  slots,
  slottedMetadata,
  automation,
  onSlotClick,
  onToggleAutoRestart,
}: {
  slots: MiningSlot[];
  slottedMetadata: Record<number, ParsedNFTMetadata>;
  automation: TyconGameState['automation'];
  onSlotClick: (index: number) => void;
  onToggleAutoRestart: (enabled: boolean) => void;
}) {
  const foremanReady = slots.some((s) => s.type === 'foreman' && s.nftId != null);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Auto-restart mining runs
            <GameTooltip content="When enabled, the server can restart your last mining run after it ends, up to your daily cap. Assign a Foreman (PIXELKREX) for a higher cap.">
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {slots.map((slot, idx) => {
          const meta = slot.nftId !== null ? slottedMetadata[slot.nftId] : null;
          const tier = slot.nftId !== null && slot.collection ? getNFTTier(slot.collection, slot.nftId, meta) : null;
          const tierKey = (tier ?? 'regular') as keyof typeof WORKER_TIER_MULTIPLIERS;
          const workerMult = slot.type === 'worker' ? (WORKER_TIER_MULTIPLIERS[tierKey] ?? 1) : null;
          const operatorMult = slot.type === 'operator' ? (OPERATOR_TIER_MULTIPLIERS[tierKey] ?? 2) : null;
          const traitBonus = meta?.traits?.reduce((sum, t) => sum + (getBonusForTrait(String(t.value))?.value ?? 0), 0) ?? 0;
          const yieldMult = workerMult != null ? (workerMult * (1 + traitBonus)).toFixed(2) : null;
          const speedMult = operatorMult != null ? (operatorMult * (1 + traitBonus)).toFixed(2) : null;
          const slotImageUrl = meta?.image ? getBestGatewayUrl(String(meta.image).replace('ipfs://', '')) : null;
          return (
            <EmptyVeinSlotFrame key={idx} onClick={() => onSlotClick(idx)} frameClassName="aspect-square">
              {!slot.nftId ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <EmptyVeinSlotPlusIcon />
                  <div>
                    <h3 className="text-base font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
                      {(slot.type as string).charAt(0).toUpperCase() + (slot.type as string).slice(1)}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Deploy {slot.collection || 'Any NFT'}</p>
                  </div>
                </div>
              ) : (
                <div className="flex w-full flex-col items-center text-center">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-200 ring-2 ring-emerald-500/30 dark:bg-zinc-800">
                    {slotImageUrl ? (
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
                  {yieldMult != null && (
                    <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-500">Yield {yieldMult}×</p>
                  )}
                  {speedMult != null && (
                    <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-500">Speed {speedMult}×</p>
                  )}
                  <div className="mt-1 flex flex-wrap justify-center gap-1">
                    {meta?.traits?.map((trait, i) => {
                      const bonus = getBonusForTrait(String(trait.value));
                      if (!bonus) return null;
                      return (
                        <span
                          key={i}
                          className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400"
                        >
                          {bonus.type} +{(bonus.value * 100).toFixed(0)}%
                        </span>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-500">Locked · active</p>
                  <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">Click to manage</p>
                </div>
              )}
            </EmptyVeinSlotFrame>
          );
        })}
      </div>
    </div>
  );
}

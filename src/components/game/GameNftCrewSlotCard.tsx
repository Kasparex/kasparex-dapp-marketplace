'use client';

import type { ReactNode } from 'react';
import { EmptyVeinSlotFrame, EmptyVeinSlotPlusIcon } from '@/components/game/EmptyVeinSlotFrame';
import { nftCrewRoleBadgeClass } from '@/lib/game/nft-crew-role-styles';
import type { MiningSlotType } from '@/lib/game/engine/types';

/**
 * Shared horizontal NFT crew slot (Diamond Veins mining row layout).
 * Image / empty frame on the left, stats on the right. Used across games so
 * chrome stays one source of truth; pass game-specific right-side content as children.
 */
export function GameNftCrewSlotCard(props: {
  roleLabel: string;
  /** Maps to platform Worker / Operator / Foreman pill colors. */
  roleType?: MiningSlotType;
  /** Extra role pill suffix (e.g. " · Free"). */
  roleSuffix?: string;
  nftId?: number | null;
  imageUrl?: string | null;
  emptyHint?: string;
  onOpenPicker: () => void;
  onRemove?: () => void;
  children: ReactNode;
  className?: string;
  /** Optional footer under the horizontal row (energy bar, actions, etc.). */
  footer?: ReactNode;
}) {
  const roleType = props.roleType ?? 'operator';
  const filled = props.nftId != null;

  return (
    <div
      className={`kx-metadata-stat-card overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-white/[0.06] ${props.className ?? ''}`.trim()}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch">
        <div className="mx-auto w-full max-w-[11rem] shrink-0 sm:mx-0 sm:w-44">
          <EmptyVeinSlotFrame onClick={props.onOpenPicker} frameClassName="aspect-square" className="!p-3">
            <div className="relative flex h-full w-full flex-col items-center justify-center pt-6">
              <span
                className={`absolute left-2 top-2 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${nftCrewRoleBadgeClass(roleType)}`}
              >
                {props.roleLabel}
                {props.roleSuffix ?? ''}
              </span>
              {filled && props.onRemove ? (
                <button
                  type="button"
                  className="absolute right-2 top-2 z-[2] flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300/90 bg-white/95 text-zinc-600 shadow-sm hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-600 dark:bg-zinc-900/95"
                  aria-label="Remove NFT"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onRemove?.();
                  }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
              {!filled ? (
                <div className="flex flex-col items-center gap-2 text-center">
                  <EmptyVeinSlotPlusIcon />
                  <p className="text-xs text-zinc-500">{props.emptyHint ?? 'Deploy NFT'}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="h-20 w-20 overflow-hidden rounded-xl bg-zinc-200 ring-2 ring-emerald-500/30 dark:bg-zinc-800">
                    {props.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={props.imageUrl} alt={`#${props.nftId}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">💎</div>
                    )}
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">#{props.nftId}</h3>
                </div>
              )}
            </div>
          </EmptyVeinSlotFrame>
        </div>

        <div className="min-w-0 flex-1 space-y-3">{props.children}</div>
      </div>
      {props.footer ? (
        <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">{props.footer}</div>
      ) : null}
    </div>
  );
}

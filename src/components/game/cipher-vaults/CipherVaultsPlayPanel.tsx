'use client';

import { useEffect, useMemo, useState } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameOverviewTitleBlock } from '@/components/games/panels/GameOverviewSections';
import { HubMetadataStatGrid } from '@/components/hub/HubMetadataStatGrid';
import { GameNftCrewSlotCard } from '@/components/game/GameNftCrewSlotCard';
import { AddNftSlotModal } from '@/components/game/AddNftSlotModal';
import { GameBuySlotsButton } from '@/components/games/GameBuySlotsButton';
import {
  KasparexNftSlotSelector,
  kasparexNftRefToCollectionAndId,
} from '@/components/nft/KasparexNftSlotSelector';
import { KxBadge } from '@/components/ui/KxBadge';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKasparexGlobalNftUsage } from '@/hooks/useKasparexGlobalNftUsage';
import { getMinecoreDeckCollectionAllowlist } from '@/lib/nft/minecore-deck-collections';
import { fetchNFTMetadata } from '@/lib/nft/metadata';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import type { MiningSlotType } from '@/lib/game/engine/types';
import {
  CIPHER_WARDEN_PERKS,
  getCipherVaultTier,
  type CipherWardenTier,
} from '@/lib/game/cipher-vaults-config';
import type { CipherRun, CipherWardenSlot } from '@/lib/game/cipher-vaults-types';
import type { CipherMove } from '@/lib/game/cipher-grid';
import { CipherGridPuzzle } from './CipherGridPuzzle';
import { CipherGridLockedPreview } from './CipherGridLockedPreview';

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

async function resolveNftImageUrl(collection: string, tokenId: number): Promise<string | null> {
  try {
    const meta = await fetchNFTMetadata(collection, tokenId);
    const raw = meta?.image?.trim();
    if (!raw) return null;
    return getBestGatewayUrl(raw.replace(/^ipfs:\/\//i, ''));
  } catch {
    return null;
  }
}

export function CipherVaultsPlayPanel(props: {
  run: CipherRun | null;
  runActive: boolean;
  puzzle: { size: number; initial: number[]; target: number[]; moveLimit: number } | null;
  solveMsLeft: number;
  covenantMsLeft: number;
  boosterMult: number;
  inventory: { rune_hint: number; vault_pass: number };
  wardenSlots: Array<CipherWardenSlot | null>;
  slotUnlockKas: number;
  submitting: boolean;
  getKasPriceAfterDiscount: (listKas: number) => number;
  onSubmit: (moves: CipherMove[]) => Promise<void>;
  onFailed: () => void;
  onCancel: () => void;
  onRetry: () => Promise<boolean>;
  onResume: () => void;
  onConsumeHint: () => boolean;
  onSetWarden: (
    slotIndex: number,
    slot: {
      nftRef: string;
      collection: string;
      tokenId: number;
      tier?: CipherWardenTier;
      imageUrl?: string | null;
    },
  ) => void;
  onClearWarden: (slotIndex: number) => void;
  onPurchaseWardenSlots: (slotTypes: MiningSlotType[]) => Promise<boolean>;
}) {
  const { state: wallet } = useKaspaWallet();
  const payerKaspa = wallet.address?.trim();
  const { usageByRef, inUseRefs } = useKasparexGlobalNftUsage({
    payerKaspa,
    precisionOperative: props.wardenSlots as any,
  });

  const [nftPickerIndex, setNftPickerIndex] = useState<number | null>(null);
  const [buySlotOpen, setBuySlotOpen] = useState(false);
  const [hintIndex, setHintIndex] = useState<number | null>(null);

  const tier = props.run ? getCipherVaultTier(props.run.tierId) : null;
  const onSetWarden = props.onSetWarden;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      for (let i = 0; i < props.wardenSlots.length; i++) {
        const slot = props.wardenSlots[i];
        if (!slot?.nftRef || slot.imageUrl) continue;
        const url = await resolveNftImageUrl(slot.collection, slot.tokenId);
        if (cancelled || !url) continue;
        onSetWarden(i, {
          nftRef: slot.nftRef,
          collection: slot.collection,
          tokenId: slot.tokenId,
          tier: slot.tier,
          imageUrl: url,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.wardenSlots, onSetWarden]);

  const pickerSlot = nftPickerIndex != null ? props.wardenSlots[nftPickerIndex] ?? null : null;
  const slotPriceByType = useMemo(
    () =>
      ({
        worker: props.getKasPriceAfterDiscount(props.slotUnlockKas),
        operator: props.getKasPriceAfterDiscount(props.slotUnlockKas),
      }) as Record<MiningSlotType, number>,
    [props.getKasPriceAfterDiscount, props.slotUnlockKas],
  );

  const stats = [
    {
      label: 'Solve timer',
      value: props.runActive ? formatDuration(props.solveMsLeft) : '—',
      tooltipTitle: 'Solve countdown',
      tooltipDescription: 'Time left to submit a solved Cipher Grid for this covenant attempt.',
    },
    {
      label: 'Covenant window',
      value: props.covenantMsLeft > 0 ? formatDuration(props.covenantMsLeft) : 'Closed',
      tooltipTitle: 'Covenant window',
      tooltipDescription: 'Broader vault window. Chrono Seals and Cipher Wardens can extend it.',
    },
    {
      label: 'Vault',
      value: tier?.label ?? 'None',
      tooltipTitle: 'Active vault class',
      tooltipDescription: 'The covenant chamber you paid to open.',
    },
    {
      label: 'Booster',
      value: props.boosterMult > 1 ? `×${props.boosterMult}` : 'Off',
      tooltipTitle: 'Shop booster',
      tooltipDescription: 'Active fragment multiplier from the Cipher Shop.',
    },
  ];

  return (
    <div className="space-y-6">
      <GameOverviewTitleBlock
        as="h2"
        kicker="Play"
        title="Cipher Vault chamber"
        subtitle="Solve the rune grid before the seal collapses."
      />

      <HubMetadataStatGrid stats={stats} />

      {props.run && !props.puzzle ? (
        <GamePanelCard title="Active covenant" hint="Resume your puzzle from the server.">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            You have an open vault on the server. Resume to load the Cipher Grid, or end the run (no refund) to start
            another.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="k-control-btn" onClick={props.onResume}>
              Resume run
            </button>
            <button type="button" className="k-control-btn" onClick={props.onCancel}>
              End run (no refund)
            </button>
            {(props.run.retriesLeft ?? 0) > 0 ? (
              <button type="button" className="k-cta-games h-11 px-4 text-sm" onClick={() => void props.onRetry()}>
                Use Second Seal ({props.run.retriesLeft})
              </button>
            ) : null}
          </div>
        </GamePanelCard>
      ) : null}

      <GamePanelCard
        title="Cipher Grid"
        hint={props.runActive ? 'Swap runes to match the Vault Seal.' : 'Pay entry to reveal the grid.'}
      >
        {props.puzzle && props.run ? (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={props.inventory.rune_hint <= 0}
                className="k-control-btn disabled:opacity-50"
                onClick={() => {
                  if (!props.onConsumeHint() || !props.puzzle) return;
                  const wrong: number[] = [];
                  for (let i = 0; i < props.puzzle.initial.length; i++) {
                    if (props.puzzle.initial[i] !== props.puzzle.target[i]) wrong.push(i);
                  }
                  if (wrong.length) setHintIndex(wrong[Math.floor(Math.random() * wrong.length)]!);
                }}
              >
                Use Rune Hint ({props.inventory.rune_hint})
              </button>
              <button type="button" className="k-control-btn" onClick={props.onCancel}>
                End run (no refund)
              </button>
              {(props.run?.retriesLeft ?? 0) > 0 ? (
                <button type="button" className="k-control-btn" onClick={() => void props.onRetry()}>
                  Second Seal ({props.run?.retriesLeft})
                </button>
              ) : null}
            </div>
            <CipherGridPuzzle
              size={props.puzzle.size}
              initial={props.puzzle.initial}
              target={props.puzzle.target}
              moveLimit={props.puzzle.moveLimit}
              solveMsLeft={props.solveMsLeft}
              hintIndex={hintIndex}
              onHintConsumed={() => setHintIndex(null)}
              onSolved={async (moves) => {
                await props.onSubmit(moves);
              }}
              onFailed={props.onFailed}
            />
            {props.submitting ? (
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">Verifying solution…</p>
            ) : null}
          </>
        ) : (
          <CipherGridLockedPreview />
        )}
      </GamePanelCard>

      <GamePanelCard
        title="Cipher Wardens"
        right={
          <GameBuySlotsButton onClick={() => setBuySlotOpen(true)}>
            Buy Slot · {props.slotUnlockKas} KAS
          </GameBuySlotsButton>
        }
      >
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Slot a Krex deck NFT as a Cipher Warden. Standard adds +1 swap and +1m. Partner / Premium / Diamond / Rarest
          scale moves, solve time, fragment mult, and covenant window. NFTs already assigned elsewhere stay locked here.
        </p>
        <div className="space-y-4">
          {props.wardenSlots.map((warden, idx) => {
            const label = warden ? CIPHER_WARDEN_PERKS[warden.tier].label : null;
            const perks = warden ? CIPHER_WARDEN_PERKS[warden.tier] : null;
            return (
              <Tooltip
                key={`w-${idx}`}
                content={gameTooltipRich(
                  'Cipher Warden',
                  idx === 0
                    ? 'Free crew slot. Grants move, time, and fragment perks while slotted.'
                    : 'Extra paid Cipher Warden slot. Stacks covenant extend; best fragment mult applies.',
                )}
              >
                <div>
                  <GameNftCrewSlotCard
                    roleLabel="Cipher Warden"
                    roleType="operator"
                    nftId={warden?.tokenId ?? null}
                    imageUrl={warden?.imageUrl}
                    emptyHint="Deploy NFT"
                    onOpenPicker={() => setNftPickerIndex(idx)}
                    onRemove={warden ? () => props.onClearWarden(idx) : undefined}
                  >
                    {warden && perks ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                            +{perks.extraMoves} swaps · +{Math.round(perks.extraTimeMs / 60000)}m
                          </p>
                          <span className="rounded-full border border-sky-500/40 bg-sky-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-sky-800 dark:text-sky-300">
                            {label}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          <KxBadge variant="emerald" className="!px-2 !py-0.5 text-[10px] font-bold">
                            ×{perks.fragmentMult} clear
                          </KxBadge>
                          <KxBadge variant="sky" className="!px-2 !py-0.5 text-[10px] font-bold">
                            +{Math.round(perks.covenantExtendMs / 3600000)}h window
                          </KxBadge>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full min-h-[7rem] flex-col justify-center">
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">No warden slotted</p>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          Deploy a deck NFT to gain vault perks.
                        </p>
                      </div>
                    )}
                  </GameNftCrewSlotCard>
                </div>
              </Tooltip>
            );
          })}
        </div>
      </GamePanelCard>

      <AddNftSlotModal
        open={buySlotOpen}
        onClose={() => setBuySlotOpen(false)}
        title="Buy Cipher Warden slot"
        description={`Unlock extra Cipher Warden slots (${props.slotUnlockKas} KAS each before KREX discount). First slot is free.`}
        options={[{ value: 'worker', label: 'Cipher Warden', badge: `${props.slotUnlockKas} KAS` }]}
        priceByType={slotPriceByType}
        initialTypes={['worker']}
        onPurchase={props.onPurchaseWardenSlots}
      />

      <KasparexNftSlotSelector
        isOpen={nftPickerIndex != null}
        title="Choose Cipher Warden"
        description="Deploy an NFT to gain move, time, and fragment perks on Cipher Vaults."
        currentValue={pickerSlot?.nftRef ?? null}
        inUseRefs={inUseRefs}
        usageByRef={usageByRef}
        currentContext={{
          entityType: 'cipher-vaults',
          entityId: 'cipher-warden',
          slotIndex: nftPickerIndex ?? 0,
        }}
        collectionAllowlist={getMinecoreDeckCollectionAllowlist()}
        footerNotice="Assignments save to Cipher Vaults in this browser. NFTs already assigned elsewhere show as locked here."
        onClose={() => setNftPickerIndex(null)}
        onRemove={() => {
          if (nftPickerIndex != null) props.onClearWarden(nftPickerIndex);
          setNftPickerIndex(null);
        }}
        onSelect={(nftRef) => {
          const idx = nftPickerIndex;
          if (idx == null) return;
          const parsed = kasparexNftRefToCollectionAndId(nftRef);
          if (!parsed) return;
          void (async () => {
            const imageUrl = await resolveNftImageUrl(parsed.collection, parsed.tokenId);
            props.onSetWarden(idx, {
              nftRef,
              collection: parsed.collection,
              tokenId: parsed.tokenId,
              imageUrl,
            });
            setNftPickerIndex(null);
          })();
        }}
      />
    </div>
  );
}

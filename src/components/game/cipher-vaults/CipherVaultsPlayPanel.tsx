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
  CIPHER_COVENANT_WINDOW_MS,
  CIPHER_LEVELS,
  CIPHER_WARDEN_PERKS,
  getCipherLevel,
  getCipherVaultTier,
  type CipherWardenTier,
} from '@/lib/game/cipher-vaults-config';
import type { CipherActiveLevel, CipherWardenSlot } from '@/lib/game/cipher-vaults-types';
import type { CipherMove } from '@/lib/game/cipher-grid';
import { CipherGridPuzzle } from './CipherGridPuzzle';
import { CipherGridLockedPreview } from './CipherGridLockedPreview';
import { KX_SURFACE_NESTED } from '@/lib/hub/shellTokens';

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
  covenantActive: boolean;
  covenantMsLeft: number;
  activeLevel: CipherActiveLevel | null;
  activeLevelSolveMsLeft: number;
  clearedLevels: number[];
  maxUnlockedLevel: number;
  vaultTierId: string | null;
  sealPoints: number;
  boosterMult: number;
  retriesLeft: number;
  inventory: { rune_hint: number; vault_pass: number };
  wardenSlots: Array<CipherWardenSlot | null>;
  slotUnlockKas: number;
  submitting: boolean;
  getKasPriceAfterDiscount: (listKas: number) => number;
  bankForLevel: (levelId: number) => number;
  onStartLevel: (levelId: number) => boolean | Promise<boolean>;
  onSubmit: (moves: CipherMove[]) => Promise<void>;
  onAbandon: () => void;
  onRetry: () => Promise<boolean> | boolean;
  onConsumeHint: () => boolean;
  onSealPointsDelta?: (delta: number) => void;
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

  const [selectedLevel, setSelectedLevel] = useState(1);
  const [nftPickerIndex, setNftPickerIndex] = useState<number | null>(null);
  const [buySlotOpen, setBuySlotOpen] = useState(false);
  const [hintIndex, setHintIndex] = useState<number | null>(null);

  const vault = props.vaultTierId ? getCipherVaultTier(props.vaultTierId as any) : null;
  const onSetWarden = props.onSetWarden;
  const lockPct = Math.max(0, Math.min(100, (props.covenantMsLeft / CIPHER_COVENANT_WINDOW_MS) * 100));
  const activeDef = props.activeLevel ? getCipherLevel(props.activeLevel.levelId) : null;

  useEffect(() => {
    if (!props.covenantActive) {
      setSelectedLevel(1);
      return;
    }
    if (selectedLevel > props.maxUnlockedLevel) {
      setSelectedLevel(Math.max(1, props.maxUnlockedLevel));
    }
  }, [props.covenantActive, props.maxUnlockedLevel, selectedLevel]);

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

  const availableLevels = CIPHER_LEVELS.filter((l) => !vault || l.id <= vault.maxLevel);

  const stats = [
    {
      label: 'Level timer',
      value: props.activeLevel ? formatDuration(props.activeLevelSolveMsLeft) : '—',
      tooltipTitle: 'Level solve timer',
      tooltipDescription: 'Countdown for the level you are currently solving. Independent of the covenant window.',
    },
    {
      label: 'Covenant window',
      value: props.covenantActive ? formatDuration(props.covenantMsLeft) : 'Closed',
      tooltipTitle: 'Covenant window',
      tooltipDescription:
        'Pay once to open this window. Clear any unlocked levels without paying again. Chrono Seals and Wardens extend it.',
    },
    {
      label: 'Track',
      value: vault?.label ?? 'None',
      tooltipTitle: 'Vault track',
      tooltipDescription: 'Entry class that sets which levels you can play and the fragment multiplier.',
    },
    {
      label: 'Seal points',
      value: props.sealPoints.toLocaleString(),
      tooltipTitle: 'Seal points',
      tooltipDescription: 'Earned when a swap places runes correctly. Session score only. Cipher Fragments bank on clear.',
    },
    {
      label: 'Level reward',
      value: activeDef
        ? `${props.bankForLevel(activeDef.id).toLocaleString()} fr`
        : selectedLevel
          ? `${props.bankForLevel(selectedLevel).toLocaleString()} fr`
          : '—',
      tooltipTitle: 'Cipher Fragments on clear',
      tooltipDescription: 'Fragments banked if you submit a verified clear for this level (after multipliers).',
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
        subtitle="One payment opens the covenant. Clear levels before the window ends."
      />

      <HubMetadataStatGrid stats={stats} />

      <Tooltip
        content={gameTooltipRich(
          'Covenant timer',
          'Green fill shows remaining covenant time. Clearing a level does not close this window.',
        )}
      >
        <GamePanelCard title="Covenant timer" hint="Pay once. Play many levels.">
          <div className={`${KX_SURFACE_NESTED} space-y-3 rounded-xl p-4`}>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Time remaining</p>
                <p className="text-xl font-black tabular-nums text-zinc-900 dark:text-zinc-100">
                  {props.covenantActive ? formatDuration(props.covenantMsLeft) : 'Locked'}
                </p>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Base 4h · extend via Chrono Seals or Cipher Wardens
              </p>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-[color:var(--hub-accent)] transition-[width] duration-500"
                style={{ width: `${props.covenantActive ? lockPct : 0}%` }}
              />
            </div>
          </div>
        </GamePanelCard>
      </Tooltip>

      <GamePanelCard title="Vault levels" hint="Pick an unlocked level. Cleared levels stay sealed this covenant.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {availableLevels.map((level) => {
            const cleared = props.clearedLevels.includes(level.id);
            const unlocked =
              props.covenantActive && level.id <= props.maxUnlockedLevel && !cleared;
            const selected = selectedLevel === level.id;
            const reward = props.bankForLevel(level.id);
            return (
              <Tooltip
                key={level.id}
                content={gameTooltipRich(
                  level.name,
                  `${level.subtitle} Grid ${level.size}×${level.size}. ${level.fogCount > 0 ? `${level.fogCount} fogged seal cells. ` : ''}Reward ~${reward.toLocaleString()} Cipher Fragments on clear.`,
                )}
              >
                <button
                  type="button"
                  disabled={!props.covenantActive}
                  onClick={() => setSelectedLevel(level.id)}
                  className={`rounded-2xl border p-3 text-left transition-colors ${
                    selected
                      ? 'border-[color:var(--hub-accent)] bg-[color:var(--hub-accent-muted,rgba(16,185,129,0.12))]'
                      : cleared
                        ? 'border-zinc-200/80 bg-zinc-100/50 opacity-70 dark:border-zinc-800 dark:bg-white/[0.03]'
                        : 'border-zinc-200/80 bg-zinc-100/80 hover:border-[color:var(--hub-accent)] dark:border-zinc-800 dark:bg-white/[0.05]'
                  }`}
                >
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Lv {level.id} · {level.name}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {level.size}×{level.size}
                    {level.fogCount > 0 ? ' · fog' : ''}
                  </p>
                  <p className="mt-2 text-sm font-semibold tabular-nums text-[color:var(--hub-accent)]">
                    {reward.toLocaleString()} fr
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                    {cleared ? 'Cleared' : unlocked ? 'Ready' : props.covenantActive ? 'Locked' : 'Pay entry'}
                  </p>
                </button>
              </Tooltip>
            );
          })}
        </div>
        {props.covenantActive && !props.activeLevel ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="k-cta-games h-11 px-5 text-sm"
              disabled={
                props.clearedLevels.includes(selectedLevel) || selectedLevel > props.maxUnlockedLevel
              }
              onClick={() => void props.onStartLevel(selectedLevel)}
            >
              Start level {selectedLevel}
            </button>
          </div>
        ) : null}
        {!props.covenantActive ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Open a vault track from the Calculation breakdown to unlock levels for this covenant window.
          </p>
        ) : null}
      </GamePanelCard>

      <GamePanelCard
        title={activeDef ? activeDef.name : 'Cipher Grid'}
        hint={
          props.activeLevel
            ? `${activeDef?.subtitle ?? 'Solve before the level timer ends.'}`
            : 'Start a level to reveal the arena.'
        }
      >
        {props.activeLevel ? (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={props.inventory.rune_hint <= 0}
                className="k-control-btn disabled:opacity-50"
                onClick={() => {
                  if (!props.onConsumeHint() || !props.activeLevel) return;
                  const wrong: number[] = [];
                  for (let i = 0; i < props.activeLevel.initial.length; i++) {
                    // Hint against current board: use initial as proxy; puzzle owns live grid
                    if (props.activeLevel.initial[i] !== props.activeLevel.target[i]) wrong.push(i);
                  }
                  if (wrong.length) setHintIndex(wrong[Math.floor(Math.random() * wrong.length)]!);
                }}
              >
                Use Rune Hint ({props.inventory.rune_hint})
              </button>
              <button type="button" className="k-control-btn" onClick={props.onAbandon}>
                Abandon level
              </button>
              {props.retriesLeft > 0 ? (
                <button type="button" className="k-control-btn" onClick={() => void props.onRetry()}>
                  Second Seal ({props.retriesLeft})
                </button>
              ) : null}
            </div>
            <CipherGridPuzzle
              size={props.activeLevel.size}
              initial={props.activeLevel.initial}
              target={props.activeLevel.target}
              moveLimit={props.activeLevel.moveLimit}
              solveMsLeft={props.activeLevelSolveMsLeft}
              fogHidden={props.activeLevel.fogHidden}
              hintIndex={hintIndex}
              onHintConsumed={() => setHintIndex(null)}
              onSealPointsDelta={props.onSealPointsDelta}
              onSolved={async (moves) => {
                await props.onSubmit(moves);
              }}
              onFailed={() => {
                if (props.retriesLeft > 0) void props.onRetry();
                else props.onAbandon();
              }}
            />
            {props.submitting ? (
              <p className="mt-3 text-xs text-zinc-500">Verifying clear…</p>
            ) : null}
          </>
        ) : (
          <CipherGridLockedPreview size={getCipherLevel(selectedLevel)?.size ?? 4} />
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
          Slot a Krex deck NFT as a Cipher Warden. Perks add swaps, level time, fragment mult, and covenant window.
          NFTs already assigned elsewhere stay locked here.
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
                          {warden.tier === 'diamond' || warden.tier === 'rarest' || warden.tier === 'premium' ? (
                            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                              {warden.tier === 'rarest'
                                ? 'Rarest'
                                : warden.tier === 'diamond'
                                  ? 'Diamond'
                                  : 'Premium'}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-2 grid gap-2 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
                          <p>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">Role:</span> Cipher
                            Warden
                          </p>
                          <p>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">Collection:</span>{' '}
                            {warden.collection}
                          </p>
                          <p>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">Fragment mult:</span> ×
                            {perks.fragmentMult}
                          </p>
                          <p>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">Window:</span> +
                            {Math.round(perks.covenantExtendMs / 3600000)}h
                          </p>
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

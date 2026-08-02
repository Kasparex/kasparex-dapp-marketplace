'use client';

import { useEffect, useMemo, useState } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameOverviewTitleBlock } from '@/components/games/panels/GameOverviewSections';
import { GameLockWindowPanel } from '@/components/games/panels/GameLockWindowPanel';
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

  const getKasPriceAfterDiscount = props.getKasPriceAfterDiscount;
  const slotUnlockKas = props.slotUnlockKas;
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
        worker: getKasPriceAfterDiscount(slotUnlockKas),
        operator: getKasPriceAfterDiscount(slotUnlockKas),
      }) as Record<MiningSlotType, number>,
    [getKasPriceAfterDiscount, slotUnlockKas],
  );

  const availableLevels = CIPHER_LEVELS.filter((l) => !vault || l.id <= vault.maxLevel);

  const stats = [
    {
      label: 'Covenant window',
      value: props.covenantActive ? formatDuration(props.covenantMsLeft) : 'Closed',
      copyable: false,
      tooltipTitle: 'Covenant window',
      tooltipDescription:
        'Pay once to open this window. Clear unlocked levels without paying again. Chrono Seals and Wardens extend it.',
    },
    {
      label: 'Track',
      value: vault?.label ?? 'None',
      copyable: false,
      tooltipTitle: 'Vault track',
      tooltipDescription: 'Entry class that sets which levels you can play and the fragment multiplier.',
    },
    {
      label: 'Seal points',
      value: props.sealPoints.toLocaleString(),
      copyable: false,
      tooltipTitle: 'Seal points',
      tooltipDescription: 'Earned when a swap places runes correctly. Session score only. Cipher Fragments bank on clear.',
    },
    {
      label: 'Level reward',
      value: `${props.bankForLevel(activeDef?.id ?? selectedLevel).toLocaleString()} fr`,
      copyable: false,
      accent: true,
      tooltipTitle: 'Cipher Fragments on clear',
      tooltipDescription: 'Fragments banked if you submit a verified clear for this level (after multipliers).',
    },
    {
      label: 'Booster',
      value: props.boosterMult > 1 ? `×${props.boosterMult}` : 'Off',
      copyable: false,
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
          'Vault levels',
          'Cleared levels stay sealed until this covenant expires or you pay entry again for a fresh ladder.',
        )}
      >
        <div>
          <GamePanelCard title="Vault levels">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                      disabled={(!unlocked && !cleared) || Boolean(props.activeLevel)}
                      onClick={() => setSelectedLevel(level.id)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        selected
                          ? 'border-[color:var(--hub-accent)] bg-[color:var(--hub-accent)]/10'
                          : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700'
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Lv {level.id}
                        {cleared ? ' · Cleared' : !unlocked ? ' · Locked' : ''}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">{level.name}</p>
                      <p className="mt-1 text-[11px] tabular-nums text-[color:var(--hub-accent)]">
                        {reward.toLocaleString()} fr · {level.size}×{level.size}
                        {level.fogCount > 0 ? ' · fog' : ''}
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
                  className="k-cta-games h-11 min-h-[2.75rem] px-5 text-sm leading-none"
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
        </div>
      </Tooltip>

      <GamePanelCard
        title={activeDef ? activeDef.name : 'Cipher Grid'}
        hint={
          props.activeLevel
            ? `${activeDef?.subtitle ?? 'Solve before the level timer ends.'}`
            : 'Start a level to reveal the arena.'
        }
        right={
          props.activeLevel ? (
            <button
              type="button"
              disabled={props.inventory.rune_hint <= 0}
              className="k-control-btn disabled:opacity-50"
              onClick={() => {
                if (!props.onConsumeHint() || !props.activeLevel) return;
                const wrong: number[] = [];
                for (let i = 0; i < props.activeLevel.initial.length; i++) {
                  if (props.activeLevel.initial[i] !== props.activeLevel.target[i]) wrong.push(i);
                }
                if (wrong.length) setHintIndex(wrong[Math.floor(Math.random() * wrong.length)]!);
              }}
            >
              Rune Hint ({props.inventory.rune_hint})
            </button>
          ) : undefined
        }
      >
        {props.activeLevel ? (
          <>
            <CipherGridPuzzle
              size={props.activeLevel.size}
              initial={props.activeLevel.initial}
              target={props.activeLevel.target}
              moveLimit={props.activeLevel.moveLimit}
              solveMsLeft={props.activeLevelSolveMsLeft}
              fogHidden={props.activeLevel.fogHidden}
              hintIndex={hintIndex}
              retriesLeft={props.retriesLeft}
              onHintConsumed={() => setHintIndex(null)}
              onSealPointsDelta={props.onSealPointsDelta}
              onSolved={async (moves) => {
                await props.onSubmit(moves);
              }}
              onFailed={() => {
                if (props.retriesLeft > 0) void props.onRetry();
                else props.onAbandon();
              }}
              onAbandon={props.onAbandon}
              onRetry={() => void props.onRetry()}
            />
            {props.submitting ? (
              <p className="mt-3 text-xs text-zinc-500">Verifying clear…</p>
            ) : null}
          </>
        ) : (
          <CipherGridLockedPreview size={getCipherLevel(selectedLevel)?.size ?? 4} />
        )}
      </GamePanelCard>

      <GameLockWindowPanel
        title="Covenant window"
        msLeft={props.covenantMsLeft}
        active={props.covenantActive}
        pct={lockPct}
        baseNote="Base 4h · extend via Chrono Seals or Cipher Wardens"
        tooltipTitle="Covenant window"
        tooltipDescription="Your paid Cipher Vault timer. Clearing a level does not close it. Chrono Seals and Cipher Warden NFTs extend it. Removing a Warden removes its time bonus."
      />

      <GamePanelCard
        title="Cipher Wardens"
        right={
          <GameBuySlotsButton onClick={() => setBuySlotOpen(true)}>
            Buy Slot · {props.slotUnlockKas} KAS
          </GameBuySlotsButton>
        }
      >
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Slot a Krex deck NFT as a Cipher Warden. Standard +1m / +5 swaps. Partner +3m / +15. Premium +5m / +25.
          Diamond +6m / +30. Rarest +7m / +35. Also extends the covenant window. First slot is free.
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

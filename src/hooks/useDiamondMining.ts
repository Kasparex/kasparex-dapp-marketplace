'use client';

import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKaspaBalance } from '@/hooks/useKaspaBalance';
import { useKREXBalance } from '@/hooks/useKREXBalance'
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot'
import { resolveTokenAmountFromKas } from '@/lib/pricing/registry';
import type { BonusType } from '@/lib/game/diamond-bonuses';
import { getNFTTier } from '@/lib/game/diamond-bonuses';
import {
  DIAMOND_VEINS_GARAGE_ADDRESS,
  REFINE_MIN_DIAMONDS,
  GARAGE_REVENUE_TO_POOL_PCT,
  DIAMOND_VEINS_NFT_SLOT_UNLOCK_COST_KAS,
  DIAMOND_VEINS_CONSUMABLES,
} from '@/lib/game/diamond-veins-config';
import { applyKrexFeeDiscount } from '@/lib/hub/applyKrexFeeDiscount';
import type { KREXTier } from '@/lib/rewards/types';
import { resolveSlotEnergyMax, syncDiamondVeinsEnergyCaps } from '@/lib/game/engine/compute-yield';
import { fetchNFTMetadata, type ParsedNFTMetadata } from '@/lib/nft/metadata';
import { transferKrc20 } from '@/lib/payments/krc20Payment';
import { payKasPaymentPlan } from '@/lib/payments/kasMultiOutPay';
import { buildKasparexL1PaymentNote } from '@/lib/core/l1PaymentNote';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import {
  applyEvent,
  applyEvents,
  computeYieldStats,
  hydrateTyconState,
  createInitialTyconState,
  type TyconGameState,
  type ActiveBoost,
  type MiningSlot,
  type MiningSlotType,
  type DiamondVeinsConsumableId,
} from '@/lib/game/engine';
import { fetchDiamondVeinsServerState, pushDiamondVeinsServerSnapshot, registerGarageReceipt } from '@/lib/game/diamond-veins-api';
import {
  DIAMOND_VEINS_STORAGE_PREFIX,
  DIAMOND_VEINS_EXTERNAL_PERSIST_EVENT,
  diamondVeinsStorageKey,
} from '@/lib/game/diamond-veins-hub';
import { verifyKaspaL1Payment, recordL1Reward } from '@/lib/games/sdk';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';

export type { MiningSlot, ActiveBoost } from '@/lib/game/engine';

const SERVER_SYNC_MS = 2500;
const DEFAULT_TREASURY =
  process.env.NEXT_PUBLIC_GAME_TREASURY_ADDRESS?.trim() || DIAMOND_VEINS_GARAGE_ADDRESS;

function walletStorageKey(address: string): string {
  return diamondVeinsStorageKey(address);
}

function loadPersistedTycon(address: string): TyconGameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(walletStorageKey(address));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TyconGameState>;
    if (!parsed || typeof parsed !== 'object') return null;
    const state = hydrateTyconState(parsed);
    const owner = (state.lastConnectedAddress ?? '').trim();
    // Reject foreign / legacy guest dumps copied onto this wallet key.
    if (owner && owner !== address.trim()) return null;
    if (
      !owner &&
      (state.diamondsEarnedLifetime ?? 0) <= 0 &&
      (state.diamonds > 0 || (state.refinementPointsTotal ?? 0) > 0)
    ) {
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

function savePersistedTycon(address: string, state: TyconGameState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(walletStorageKey(address), JSON.stringify(state));
    // Drop legacy guest bucket so it cannot seed other wallets or Hub point reads.
    try {
      localStorage.removeItem(DIAMOND_VEINS_STORAGE_PREFIX);
    } catch {
      // ignore
    }
    // Refresh hub points UI only. Do not broadcast DIAMOND_VEINS_EXTERNAL_PERSIST_EVENT here:
    // this hook also listens for that event to reload from disk (external Hub writes), and
    // broadcasting on every autosave would recurse into Maximum update depth.
    window.dispatchEvent(new Event('kasparex-redeemable-breakdown-refresh'));
  } catch {
    // ignore
  }
}

function pruneExpiredBoosts(state: TyconGameState, nowMs: number): TyconGameState {
  const nextBoosts = state.activeBoosts.filter((b) => b.endTime > nowMs);
  if (nextBoosts.length === state.activeBoosts.length) return state;
  return {
    ...state,
    activeBoosts: nextBoosts,
    version: state.version + 1,
  };
}

/** Apply missed idle seconds (tab closed / wallet briefly disconnected). Caps at 8h. */
function catchUpIdleMining(
  state: TyconGameState,
  krexTier: string,
  meta: Record<number, ParsedNFTMetadata>,
  now: number,
): TyconGameState {
  const last = state.lastIdleTickAt ?? state.lastConnectedAt ?? now;
  let remaining = Math.min(Math.max(0, Math.floor((now - last) / 1000)), 8 * 3600);
  if (remaining <= 0) {
    return state.lastIdleTickAt == null ? { ...state, lastIdleTickAt: now } : state;
  }
  let s = pruneExpiredBoosts(state, now);
  let guard = 0;
  while (remaining > 0 && guard++ < 64) {
    const st = computeYieldStats(s, krexTier, meta, now);
    const slotDeltas = st.slots.map((x) => x.yieldPerSecond);
    const energyDrains = st.slots.map((x) => (x.status === 'mining' && x.yieldPerSecond > 0 ? 1000 : 0));
    if (slotDeltas.every((d) => d <= 0)) break;
    let step = remaining;
    for (let i = 0; i < s.slots.length; i++) {
      if ((energyDrains[i] ?? 0) <= 0) continue;
      const energy = s.slots[i]?.energy ?? 0;
      step = Math.min(step, Math.max(1, Math.floor(energy / (energyDrains[i] ?? 1000))));
    }
    const next = applyEvent(s, {
      type: 'TickIdleMining',
      deltaSeconds: step,
      slotDeltas,
      energyDrains,
      at: now,
    });
    if (next.version === s.version) break;
    s = next;
    remaining -= step;
  }
  return s.lastIdleTickAt === now ? s : { ...s, lastIdleTickAt: now };
}

export function useDiamondMining() {
  const { state: walletState } = useKaspaWallet();
  const { balanceInKas, refresh: refreshKasBalance, isLoading: kasBalanceHookLoading } = useKaspaBalance();
  const { balance: krexBalance, l1Balance: krexL1Balance, tier: krexTier } = useKREXBalance();
  const { snapshot: pricingSnapshot } = usePricingSnapshot(['KREX']);

  const walletAddr = walletState.address?.trim() ?? '';

  const [tycon, setTycon] = useState<TyconGameState>(() => createInitialTyconState());
  const tyconRef = useRef(tycon);
  tyconRef.current = tycon;
  const prevWalletRef = useRef('');
  const hydratedRef = useRef(false);
  /** Last wallet that owned this browser profile (kept after disconnect so idle mining can continue). */
  const [boundAddr, setBoundAddr] = useState('');

  const [slottedMetadata, setSlottedMetadata] = useState<Record<number, ParsedNFTMetadata>>({});
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);
  const [lastRefineClaim, setLastRefineClaim] = useState<{ points: number; amount: number } | null>(null);
  const [lastPaymentError, setLastPaymentError] = useState<string | null>(null);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const metaRef = useRef(slottedMetadata);
  metaRef.current = slottedMetadata;

  const canPayWithL1 =
    walletState.isConnected &&
    (walletState.provider === 'kasware' || walletState.provider === 'kastle' || walletState.provider === 'kaspire');

  /** Load wallet-scoped profile before autosave can overwrite storage (Minecore pattern). */
  useLayoutEffect(() => {
    if (!walletAddr) {
      setProfileNotice(null);
      return undefined;
    }
    setBoundAddr(walletAddr);
    const loaded = loadPersistedTycon(walletAddr);
    const base = loaded ?? createInitialTyconState();
    const caught = catchUpIdleMining(base, krexTier, metaRef.current, Date.now());
    setTycon(caught);
    hydratedRef.current = true;
    let clearTimer: number | undefined;
    if (prevWalletRef.current !== walletAddr) {
      const short = `${walletAddr.slice(0, 12)}…${walletAddr.slice(-10)}`;
      setProfileNotice(`Loaded Diamond Veins profile for ${short}`);
      prevWalletRef.current = walletAddr;
      clearTimer = window.setTimeout(() => setProfileNotice(null), 6_000);
    }
    return () => {
      if (clearTimer !== undefined) window.clearTimeout(clearTimer);
    };
    // Catch-up uses current krexTier/meta once per wallet bind; do not re-run on tier flicker.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- walletAddr only
  }, [walletAddr]);

  useEffect(() => {
    const addr = walletAddr || boundAddr;
    if (!addr || !hydratedRef.current) return;
    savePersistedTycon(addr, tycon);
  }, [walletAddr, boundAddr, tycon]);

  useEffect(() => {
    const addr = walletAddr || boundAddr;
    if (!addr) return;
    function reloadFromDisk() {
      const loaded = loadPersistedTycon(addr);
      if (loaded) setTycon(loaded);
    }
    window.addEventListener(DIAMOND_VEINS_EXTERNAL_PERSIST_EVENT, reloadFromDisk);
    return () => window.removeEventListener(DIAMOND_VEINS_EXTERNAL_PERSIST_EVENT, reloadFromDisk);
  }, [walletAddr, boundAddr]);

  useEffect(() => {
    if (!canPayWithL1) return;
    void refreshKasBalance();
    const t = setInterval(() => {
      void refreshKasBalance();
    }, 2500);
    return () => clearInterval(t);
  }, [canPayWithL1, refreshKasBalance]);

  const kasBalance = balanceInKas ?? 0;

  useEffect(() => {
    if (walletState.isConnected && walletAddr) {
      const now = Date.now();
      setTycon((s) =>
        applyEvent(s, {
          type: 'HeartbeatConnect',
          address: walletAddr,
          at: now,
        }),
      );
    }
  }, [walletState.isConnected, walletAddr]);

  useEffect(() => {
    if (!walletAddr || !walletState.isConnected || !hydratedRef.current) return;
    let cancelled = false;
    void (async () => {
      const remote = await fetchDiamondVeinsServerState(walletAddr);
      if (cancelled || !remote) return;
      setTycon((local) => (remote.version > local.version ? hydrateTyconState(remote) : local));
    })();
    return () => {
      cancelled = true;
    };
  }, [walletAddr, walletState.isConnected]);

  useEffect(() => {
    if (!walletAddr || !walletState.isConnected || !hydratedRef.current) return;
    const t = setTimeout(() => {
      void pushDiamondVeinsServerSnapshot(walletAddr, tyconRef.current).then((res) => {
        if (res?.state && res.state.version > tyconRef.current.version) {
          setTycon(hydrateTyconState(res.state));
        }
      });
    }, SERVER_SYNC_MS);
    return () => clearTimeout(t);
  }, [tycon, walletAddr, walletState.isConnected]);

  useEffect(() => {
    const fetchMetadata = async () => {
      for (const slot of tycon.slots) {
        if (slot.nftId !== null && !slottedMetadata[slot.nftId] && slot.collection) {
          try {
            const meta = await fetchNFTMetadata(slot.collection, slot.nftId);
            if (meta) {
              setSlottedMetadata((prev) => ({ ...prev, [slot.nftId!]: meta }));
            }
          } catch (e) {
            console.error('Failed to fetch metadata for slot', slot.nftId, e);
          }
        }
      }
    };
    void fetchMetadata();
  }, [tycon.slots]);

  const stats = useMemo(
    () => computeYieldStats(tycon, krexTier, slottedMetadata),
    [tycon, krexTier, slottedMetadata],
  );

  const liveBoosts = useMemo(
    () => tycon.activeBoosts.filter((b) => b.endTime > Date.now()),
    [tycon.activeBoosts, tycon.version],
  );

  /** Idle mining continues after disconnect once a wallet profile is bound (Minecore-style). */
  const miningAllowed = Boolean(boundAddr || tycon.lastConnectedAt);

  // Idle tick: prune expired boosts, then mine + drain energy
  useEffect(() => {
    if (!miningAllowed) return;
    const interval = setInterval(() => {
      setTycon((s) => {
        const now = Date.now();
        let next = pruneExpiredBoosts(s, now);
        next = syncDiamondVeinsEnergyCaps(next, metaRef.current, now);
        const st = computeYieldStats(next, krexTier, metaRef.current, now);
        const slotDeltas = st.slots.map((x) => x.yieldPerSecond);
        const energyDrains = st.slots.map((x) => (x.status === 'mining' && x.yieldPerSecond > 0 ? 1000 : 0));
        if (slotDeltas.every((d) => d <= 0) && energyDrains.every((d) => d <= 0)) {
          return next.lastIdleTickAt === now ? next : { ...next, lastIdleTickAt: now };
        }
        return applyEvent(next, {
          type: 'TickIdleMining',
          deltaSeconds: 1,
          slotDeltas,
          energyDrains,
          at: now,
        });
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [miningAllowed, krexTier, tycon.slots, tycon.activeBoosts]);

  const reconnectRequiredBy = !walletState.isConnected && !boundAddr && !tycon.lastConnectedAt;

  const deployNFT = useCallback(
    (slotIndex: number, nftId: number, collection: string) => {
      const meta = metaRef.current[nftId] ?? null;
      const tier = getNFTTier(collection, nftId, meta);
      const slot = tyconRef.current.slots[slotIndex];
      const role = slot?.type ?? 'worker';
      const energyMax = resolveSlotEnergyMax(role, tier, {
        collection,
        activeBoosts: tyconRef.current.activeBoosts,
        nowMs: Date.now(),
      });
      setTycon((s) =>
        applyEvent(s, {
          type: 'DeployNFT',
          slotIndex,
          nftId,
          collection,
          energyMax,
        }),
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kasparex-nft-usage'));
      }
    },
    [],
  );

  const removeSlot = useCallback(
    (slotIndex: number) => {
      setTycon((s) => {
        const next = applyEvent(s, { type: 'RemoveSlot', slotIndex });
        if (walletAddr && walletState.isConnected) {
          void pushDiamondVeinsServerSnapshot(walletAddr, next).catch(() => {});
        }
        return next;
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kasparex-nft-usage'));
      }
    },
    [walletAddr, walletState.isConnected],
  );

  const getKasPriceAfterDiscount = useCallback(
    (priceKas: number) => applyKrexFeeDiscount(priceKas, krexTier as KREXTier),
    [krexTier],
  );

  const payKasBestEffort = useCallback(
    async (params: { amountKas: number; skuId: string; purchaseType: 'slot' | 'unlock' | 'other' }) => {
      setLastPaymentError(null);
      if (!walletState.isConnected || !walletState.provider || !walletState.address) {
        setLastPaymentError('Wallet connection required');
        return { ok: false as const };
      }
      if (!DEFAULT_TREASURY) {
        setLastPaymentError('Treasury address not configured');
        return { ok: false as const };
      }
      const amountKas = Math.round(params.amountKas * 1e8) / 1e8;
      if (!(amountKas > 0)) {
        setLastPaymentError('Invalid payment amount');
        return { ok: false as const };
      }

      const sessionId = crypto.randomUUID();
      const note = buildKasparexL1PaymentNote({
        gameId: 'diamond-veins',
        skuId: params.skuId,
        sessionId,
      });

      let txHash: string;
      try {
        const paid = await payKasPaymentPlan(
          walletState.provider,
          {
            legs: [
              {
                role: 'treasury',
                address: DEFAULT_TREASURY,
                amount: amountKas,
                label: 'Diamond Veins garage',
              },
            ],
            note,
          },
          walletState.address,
        );
        txHash = paid.txHash;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Payment failed';
        const friendly = /websocket|not connected|remote error|rpc/i.test(message)
          ? 'Wallet RPC disconnected. Reopen KasWare / reconnect your wallet, then try again.'
          : message;
        setLastPaymentError(friendly);
        return { ok: false as const };
      }

      void recordL1Reward({
        userAddress: walletState.address,
        dappId: 'diamond-veins',
        actionType: params.purchaseType,
        actionValue: amountKas,
        txHash,
        network: 'L1',
      }).catch(() => {});

      void verifyKaspaL1Payment({
        txHash,
        payerKaspaAddress: walletState.address,
        toKaspaAddress: DEFAULT_TREASURY,
        minAmountKas: amountKas,
        gameId: 'diamond-veins',
        skuId: params.skuId,
        purchaseType: params.purchaseType,
        sessionId,
      }).catch(() => {});

      const txNorm = extractKaspaTransactionId(txHash) ?? txHash;
      appendHubActivityEarn({
        walletRaw: walletState.address,
        source: 'dapp_l1_interaction',
        redeemableDelta: HUB_EARN_POINTS.dappL1Interaction,
        krexBalance,
        idempotencyKey: `l1:diamond-veins:${params.skuId}:${params.purchaseType}:${txNorm}`,
        meta: { skuId: params.skuId, purchaseType: params.purchaseType },
      });

      void refreshKasBalance();
      return { ok: true as const, txHash };
    },
    [walletState.isConnected, walletState.provider, walletState.address, krexBalance, refreshKasBalance],
  );

  const slotPurchaseKasByType = useMemo(
    () =>
      ({
        worker: getKasPriceAfterDiscount(DIAMOND_VEINS_NFT_SLOT_UNLOCK_COST_KAS.worker),
        operator: getKasPriceAfterDiscount(DIAMOND_VEINS_NFT_SLOT_UNLOCK_COST_KAS.operator),
        foreman: getKasPriceAfterDiscount(DIAMOND_VEINS_NFT_SLOT_UNLOCK_COST_KAS.foreman),
      }) as Record<MiningSlotType, number>,
    [getKasPriceAfterDiscount],
  );

  const purchaseNftDeckSlot = useCallback(
    async (slotTypes: MiningSlotType | MiningSlotType[]) => {
      const types = (Array.isArray(slotTypes) ? slotTypes : [slotTypes]).filter(Boolean);
      if (types.length === 0) return false;
      const listPrice = types.reduce((sum, t) => sum + DIAMOND_VEINS_NFT_SLOT_UNLOCK_COST_KAS[t], 0);
      const paid = await payKasBestEffort({
        amountKas: getKasPriceAfterDiscount(listPrice),
        skuId: `diamond-veins:nft-slot:add:${types.join('+')}`,
        purchaseType: 'slot',
      });
      if (!paid.ok) return false;
      const at = Date.now();
      setTycon((s) => {
        let next = s;
        for (const slotType of types) {
          next = applyEvent(next, { type: 'AddNftDeckSlot', slotType, at });
        }
        return next;
      });
      return true;
    },
    [payKasBestEffort, getKasPriceAfterDiscount],
  );

  const refineDiamonds = useCallback(
    async (amountArg?: number): Promise<{ points: number; amount: number } | null> => {
      const prev = tyconRef.current;
      const bag = Math.floor(prev.diamonds);
      const amount =
        typeof amountArg === 'number' && Number.isFinite(amountArg)
          ? Math.max(0, Math.min(bag, Math.floor(amountArg)))
          : bag;
      if (amount < REFINE_MIN_DIAMONDS) return null;
      const at = Date.now();
      const next = applyEvent(prev, { type: 'Refine', at, amount });
      if (next.version === prev.version) return null;
      const lastEntry = next.gridLedger[next.gridLedger.length - 1];
      const refinementPoints = lastEntry?.refinementPoints ?? 0;
      const refinedAmount = lastEntry?.diamondsRefined ?? amount;

      const syntheticTx =
        typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
          ? Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('')
          : `${at}`.padStart(64, '0');
      void fetch('/api/rewards/l1/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: syntheticTx,
          userAddress: walletAddr || '',
          dappId: 'diamond-veins',
          actionType: 'refine',
          actionValue: refinementPoints,
          network: 'L1' as const,
        }),
      }).catch(() => {});

      setTycon(next);
      setLastRefineClaim({ points: refinementPoints, amount: refinedAmount });
      return { points: refinementPoints, amount: refinedAmount };
    },
    [walletAddr],
  );

  const applyGaragePurchase = useCallback(
    async (
      itemId: string,
      name: string,
      type: BonusType,
      multiplier: number,
      txHash: string,
      currency: 'KREX' | 'KAS',
      amount: number,
      quantity = 1,
    ) => {
      const qty = Math.max(1, Math.floor(quantity));
      const receiptId = `${currency}:${txHash}`;
      const boost: ActiveBoost = {
        id: `${itemId}-${Date.now()}`,
        type,
        multiplier,
        endTime: Date.now() + 3600000 * qty,
        name: qty > 1 ? `${name} ×${qty}` : name,
        pendingVerification: true,
        txHash,
      };
      const addr = walletState.address;
      if (addr) {
        const prev = tyconRef.current;
        const res = await registerGarageReceipt({
          address: addr,
          state: prev,
          receiptId,
          txHash,
          currency,
          amount,
          itemId,
          boost,
        });
        if ('state' in res) {
          setTycon(hydrateTyconState(res.state));
          return;
        }
      }
      setTycon((s) =>
        applyEvents(s, [
          { type: 'RegisterReceipt', receiptId, at: Date.now() },
          { type: 'AddBoost', boost },
        ]),
      );
    },
    [walletState.address],
  );

  const buyBoost = useCallback(
    async (
      itemId: string,
      name: string,
      priceKAS: number,
      type: BonusType,
      multiplier: number,
      quantity = 1,
    ) => {
      const qty = Math.max(1, Math.floor(quantity));
      const unitKrex = resolveTokenAmountFromKas(
        getKasPriceAfterDiscount(priceKAS),
        'KREX',
        pricingSnapshot,
      );
      const totalKrex = unitKrex * qty;
      const canPayL1 = walletState.isConnected && canPayWithL1 && walletState.provider;
      if (!canPayL1) return;
      if (krexL1Balance < totalKrex) return;

      setBuyingItemId(itemId);
      try {
        const txHash = await transferKrc20(walletState.provider!, {
          tick: 'KREX',
          amount: totalKrex,
          to: DIAMOND_VEINS_GARAGE_ADDRESS,
        });
        await applyGaragePurchase(itemId, name, type, multiplier, txHash, 'KREX', totalKrex, qty);
      } catch (err) {
        console.error('[Diamond Veins] Shop purchase failed:', err);
        throw err;
      } finally {
        setBuyingItemId(null);
      }
    },
    [
      walletState.isConnected,
      canPayWithL1,
      walletState.provider,
      krexL1Balance,
      applyGaragePurchase,
      getKasPriceAfterDiscount,
      pricingSnapshot,
    ],
  );

  const buyBoostWithKAS = useCallback(
    async (
      itemId: string,
      name: string,
      priceKAS: number,
      type: BonusType,
      multiplier: number,
      quantity = 1,
    ) => {
      const qty = Math.max(1, Math.floor(quantity));
      const priceAfterDiscountKas = getKasPriceAfterDiscount(priceKAS) * qty;
      const canPayL1 = walletState.isConnected && canPayWithL1 && walletState.provider;
      if (!canPayL1) return;
      if (kasBalance < priceAfterDiscountKas) return;

      setBuyingItemId(itemId);
      try {
        const paid = await payKasBestEffort({
          amountKas: priceAfterDiscountKas,
          skuId: `diamond-veins:boost:${itemId}`,
          purchaseType: 'other',
        });
        if (!paid.ok || !('txHash' in paid)) return;
        await applyGaragePurchase(itemId, name, type, multiplier, paid.txHash, 'KAS', priceAfterDiscountKas, qty);
      } catch (err) {
        console.error('[Diamond Veins] Shop KAS purchase failed:', err);
        throw err;
      } finally {
        setBuyingItemId(null);
      }
    },
    [
      walletState.isConnected,
      canPayWithL1,
      walletState.provider,
      kasBalance,
      applyGaragePurchase,
      getKasPriceAfterDiscount,
      payKasBestEffort,
    ],
  );

  const buyConsumable = useCallback(
    async (itemId: DiamondVeinsConsumableId, currency: 'KAS' | 'KREX', quantity = 1) => {
      const item = DIAMOND_VEINS_CONSUMABLES.find((c) => c.id === itemId);
      if (!item) return false;
      const qty = Math.max(1, Math.floor(quantity));
      setBuyingItemId(itemId);
      try {
        if (currency === 'KAS') {
          const paid = await payKasBestEffort({
            amountKas: getKasPriceAfterDiscount(item.priceKAS) * qty,
            skuId: `diamond-veins:consumable:${itemId}`,
            purchaseType: 'other',
          });
          if (!paid.ok) return false;
        } else {
          if (!canPayWithL1 || !walletState.provider) return false;
          const totalKrex =
            resolveTokenAmountFromKas(getKasPriceAfterDiscount(item.priceKAS), 'KREX', pricingSnapshot) * qty;
          if (krexL1Balance < totalKrex) return false;
          await transferKrc20(walletState.provider, {
            tick: 'KREX',
            amount: totalKrex,
            to: DIAMOND_VEINS_GARAGE_ADDRESS,
          });
        }
        setTycon((s) => applyEvent(s, { type: 'AddConsumables', itemId, count: qty, at: Date.now() }));
        return true;
      } catch {
        return false;
      } finally {
        setBuyingItemId(null);
      }
    },
    [payKasBestEffort, getKasPriceAfterDiscount, canPayWithL1, walletState.provider, krexL1Balance, pricingSnapshot],
  );

  const feedWorker = useCallback((slotIndex: number, itemId: DiamondVeinsConsumableId) => {
    const item = DIAMOND_VEINS_CONSUMABLES.find((c) => c.id === itemId);
    if (!item) return false;
    const slot = tyconRef.current.slots[slotIndex];
    if (!slot || slot.nftId == null || !slot.collection) return false;
    const meta = metaRef.current[slot.nftId] ?? null;
    const tier = getNFTTier(slot.collection, slot.nftId, meta);
    const energyMax = resolveSlotEnergyMax(slot.type, tier, {
      collection: slot.collection,
      activeBoosts: tyconRef.current.activeBoosts,
      nowMs: Date.now(),
    });
    const energyRestore = Math.floor(energyMax * item.restorePct);
    setTycon((s) =>
      applyEvent(s, {
        type: 'FeedWorker',
        slotIndex,
        itemId,
        energyRestore,
        energyMax,
        at: Date.now(),
      }),
    );
    return true;
  }, []);

  const redeemPoints = useCallback((points: number) => {
    setTycon((s) => applyEvent(s, { type: 'RedeemPoints', points, at: Date.now() }));
  }, []);

  return {
    tycon,
    diamonds: tycon.diamonds,
    diamondInventory: tycon.diamondInventory,
    slots: tycon.slots,
    stats,
    activeBoosts: liveBoosts,
    consumables: tycon.consumables,
    deployNFT,
    removeSlot,
    purchaseNftDeckSlot,
    slotPurchaseKasByType,
    slotPurchaseKas: slotPurchaseKasByType.worker,
    refineDiamonds,
    buyBoost,
    buyBoostWithKAS,
    buyConsumable,
    feedWorker,
    kasBalance,
    isConnected: walletState.isConnected,
    slottedMetadata,
    krexBalance,
    krexL1Balance,
    krexTier,
    getKasPriceAfterDiscount,
    refineMinDiamonds: REFINE_MIN_DIAMONDS,
    revenuePoolPct: Math.round(GARAGE_REVENUE_TO_POOL_PCT * 100),
    buyingItemId,
    canPayWithL1,
    refinementPointsTotal: tycon.refinementPointsTotal,
    diamondsEarnedLifetime: tycon.diamondsEarnedLifetime ?? 0,
    lastRefineClaim,
    clearLastRefineClaim: () => setLastRefineClaim(null),
    kasBalanceLoading: canPayWithL1 && kasBalanceHookLoading && balanceInKas === null,
    refreshKasBalance,
    miningAllowed,
    reconnectRequiredBy,
    gridLedger: tycon.gridLedger,
    redeemPoints,
    /** @deprecated */
    redeemGrid: redeemPoints,
    lastPaymentError,
    profileNotice,
  };
}

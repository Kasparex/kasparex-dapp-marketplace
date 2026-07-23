'use client';

import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKaspaBalance } from '@/hooks/useKaspaBalance';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import type { BonusType } from '@/lib/game/diamond-bonuses';
import { getNFTTier } from '@/lib/game/diamond-bonuses';
import {
  KREX_TIER_SHOP_DISCOUNT_PCT,
  DIAMOND_VEINS_GARAGE_ADDRESS,
  REFINE_MIN_DIAMONDS,
  GARAGE_REVENUE_TO_POOL_PCT,
  KRC20_TRANSFER_TYPE,
  KREX_DECIMALS,
  DIAMOND_VEINS_NFT_SLOT_UNLOCK_COST_KAS,
  DIAMOND_VEINS_CONSUMABLES,
} from '@/lib/game/diamond-veins-config';
import { resolveSlotEnergyMax } from '@/lib/game/engine/compute-yield';
import { fetchNFTMetadata, type ParsedNFTMetadata } from '@/lib/nft/metadata';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
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
import { payKaspaL1, verifyKaspaL1Payment, recordL1Reward } from '@/lib/games/sdk';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';

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
    const key = walletStorageKey(address);
    let raw = localStorage.getItem(key);
    // One-time migrate legacy guest bucket into this wallet if wallet key is empty.
    if (!raw) {
      const legacy = localStorage.getItem(DIAMOND_VEINS_STORAGE_PREFIX);
      if (legacy) {
        raw = legacy;
        localStorage.setItem(key, legacy);
      }
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TyconGameState>;
    if (!parsed || typeof parsed !== 'object') return null;
    return hydrateTyconState(parsed);
  } catch {
    return null;
  }
}

function savePersistedTycon(address: string, state: TyconGameState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(walletStorageKey(address), JSON.stringify(state));
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

export function useDiamondMining() {
  const { state: walletState } = useKaspaWallet();
  const { balanceInKas, refresh: refreshKasBalance, isLoading: kasBalanceHookLoading } = useKaspaBalance();
  const { balance: krexBalance, l1Balance: krexL1Balance, tier: krexTier } = useKREXBalance();

  const walletAddr = walletState.address?.trim() ?? '';

  const [tycon, setTycon] = useState<TyconGameState>(() => createInitialTyconState());
  const tyconRef = useRef(tycon);
  tyconRef.current = tycon;
  const prevWalletRef = useRef('');
  const hydratedRef = useRef(false);

  const [slottedMetadata, setSlottedMetadata] = useState<Record<number, ParsedNFTMetadata>>({});
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);
  const [lastRefineClaim, setLastRefineClaim] = useState<{ points: number; amount: number } | null>(null);
  const [lastPaymentError, setLastPaymentError] = useState<string | null>(null);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const metaRef = useRef(slottedMetadata);
  metaRef.current = slottedMetadata;

  const canPayWithL1 =
    walletState.isConnected &&
    (walletState.provider === 'kasware' || walletState.provider === 'kastle');

  /** Load wallet-scoped profile before autosave can overwrite storage (Minecore pattern). */
  useLayoutEffect(() => {
    if (!walletAddr) {
      hydratedRef.current = false;
      prevWalletRef.current = '';
      setProfileNotice(null);
      return undefined;
    }
    const loaded = loadPersistedTycon(walletAddr);
    setTycon(loaded ?? createInitialTyconState());
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
  }, [walletAddr]);

  useEffect(() => {
    if (!walletAddr || !hydratedRef.current) return;
    savePersistedTycon(walletAddr, tycon);
  }, [walletAddr, tycon]);

  useEffect(() => {
    if (!walletAddr) return;
    function reloadFromDisk() {
      const loaded = loadPersistedTycon(walletAddr);
      if (loaded) setTycon(loaded);
    }
    window.addEventListener(DIAMOND_VEINS_EXTERNAL_PERSIST_EVENT, reloadFromDisk);
    return () => window.removeEventListener(DIAMOND_VEINS_EXTERNAL_PERSIST_EVENT, reloadFromDisk);
  }, [walletAddr]);

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

  /** Mining requires a connected L1 wallet; progress stays wallet-scoped in storage (Minecore pattern). */
  const miningAllowed = Boolean(walletState.isConnected && walletAddr);

  // Idle tick: prune expired boosts, then mine + drain energy
  useEffect(() => {
    if (!miningAllowed) return;
    const interval = setInterval(() => {
      setTycon((s) => {
        const now = Date.now();
        let next = pruneExpiredBoosts(s, now);
        const st = computeYieldStats(next, krexTier, metaRef.current, now);
        const slotDeltas = st.slots.map((x) => x.yieldPerSecond);
        const energyDrains = st.slots.map((x) => (x.status === 'mining' && x.yieldPerSecond > 0 ? 1000 : 0));
        if (slotDeltas.every((d) => d <= 0) && energyDrains.every((d) => d <= 0)) return next;
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

  const deployNFT = useCallback(
    (slotIndex: number, nftId: number, collection: string) => {
      const meta = metaRef.current[nftId] ?? null;
      const tier = getNFTTier(collection, nftId, meta);
      const slot = tyconRef.current.slots[slotIndex];
      const role = slot?.type ?? 'worker';
      const energyMax = resolveSlotEnergyMax(role, tier);
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
    (priceKas: number) => {
      const discountPct = KREX_TIER_SHOP_DISCOUNT_PCT[krexTier] ?? 0;
      const discounted = priceKas * (1 - discountPct / 100);
      return Math.max(0, Math.round(discounted * 10_000) / 10_000);
    },
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

      const pay = await payKaspaL1({
        provider: walletState.provider,
        fromKaspaAddress: walletState.address,
        toKaspaAddress: DEFAULT_TREASURY,
        amountKas: params.amountKas,
        gameId: 'diamond-veins',
        skuId: params.skuId,
        purchaseType: params.purchaseType,
      });
      if (!pay.ok) {
        setLastPaymentError(pay.error);
        return { ok: false as const };
      }

      void recordL1Reward({
        userAddress: walletState.address,
        dappId: 'diamond-veins',
        actionType: params.purchaseType,
        actionValue: params.amountKas,
        txHash: pay.txHash,
        network: 'L1',
      }).catch(() => {});

      void verifyKaspaL1Payment({
        txHash: pay.txHash,
        payerKaspaAddress: walletState.address,
        toKaspaAddress: DEFAULT_TREASURY,
        minAmountKas: params.amountKas,
        gameId: 'diamond-veins',
        skuId: params.skuId,
        purchaseType: params.purchaseType,
        sessionId: pay.sessionId,
      }).catch(() => {});

      const txNorm = extractKaspaTransactionId(pay.txHash) ?? pay.txHash;
      appendHubActivityEarn({
        walletRaw: walletState.address,
        source: 'dapp_l1_interaction',
        redeemableDelta: HUB_EARN_POINTS.dappL1Interaction,
        krexBalance,
        idempotencyKey: `l1:diamond-veins:${params.skuId}:${params.purchaseType}:${txNorm}`,
        meta: { skuId: params.skuId, purchaseType: params.purchaseType },
      });

      void refreshKasBalance();
      return { ok: true as const, txHash: pay.txHash };
    },
    [walletState.isConnected, walletState.provider, walletState.address, krexBalance, refreshKasBalance],
  );

  const purchaseNftDeckSlot = useCallback(
    async (slotType: MiningSlotType) => {
      const paid = await payKasBestEffort({
        amountKas: getKasPriceAfterDiscount(DIAMOND_VEINS_NFT_SLOT_UNLOCK_COST_KAS),
        skuId: `diamond-veins:nft-slot:add:${slotType}`,
        purchaseType: 'slot',
      });
      if (!paid.ok) return false;
      setTycon((s) => applyEvent(s, { type: 'AddNftDeckSlot', slotType, at: Date.now() }));
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
    ) => {
      const receiptId = `${currency}:${txHash}`;
      const boost: ActiveBoost = {
        id: `${itemId}-${Date.now()}`,
        type,
        multiplier,
        endTime: Date.now() + 3600000,
        name,
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
    async (itemId: string, name: string, priceKrex: number, type: BonusType, multiplier: number) => {
      const canPayL1 = walletState.isConnected && canPayWithL1 && walletState.provider;
      if (!canPayL1) return;
      if (krexL1Balance < priceKrex) return;

      setBuyingItemId(itemId);
      try {
        const amountInSmallestUnit = Math.floor(priceKrex * Math.pow(10, KREX_DECIMALS));
        const inscribeJson = {
          p: 'KRC-20',
          op: 'transfer',
          tick: 'KREX',
          amt: amountInSmallestUnit.toString(),
          to: DIAMOND_VEINS_GARAGE_ADDRESS,
        };
        const txHash = await signKrc20Transfer(
          walletState.provider!,
          JSON.stringify(inscribeJson),
          KRC20_TRANSFER_TYPE,
          DIAMOND_VEINS_GARAGE_ADDRESS,
          0.001,
        );
        await applyGaragePurchase(itemId, name, type, multiplier, txHash, 'KREX', priceKrex);
      } catch (err) {
        console.error('[Diamond Veins] Garage purchase failed:', err);
        throw err;
      } finally {
        setBuyingItemId(null);
      }
    },
    [walletState.isConnected, canPayWithL1, walletState.provider, krexL1Balance, applyGaragePurchase],
  );

  const buyBoostWithKAS = useCallback(
    async (itemId: string, name: string, priceKAS: number, type: BonusType, multiplier: number) => {
      const priceAfterDiscountKas = getKasPriceAfterDiscount(priceKAS);
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
        await applyGaragePurchase(itemId, name, type, multiplier, paid.txHash, 'KAS', priceAfterDiscountKas);
      } catch (err) {
        console.error('[Diamond Veins] Garage KAS purchase failed:', err);
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
    async (itemId: DiamondVeinsConsumableId, currency: 'KAS' | 'KREX') => {
      const item = DIAMOND_VEINS_CONSUMABLES.find((c) => c.id === itemId);
      if (!item) return false;
      setBuyingItemId(itemId);
      try {
        if (currency === 'KAS') {
          const paid = await payKasBestEffort({
            amountKas: getKasPriceAfterDiscount(item.priceKAS),
            skuId: `diamond-veins:consumable:${itemId}`,
            purchaseType: 'other',
          });
          if (!paid.ok) return false;
        } else {
          if (!canPayWithL1 || !walletState.provider) return false;
          if (krexL1Balance < item.priceKrex) return false;
          const amountInSmallestUnit = Math.floor(item.priceKrex * Math.pow(10, KREX_DECIMALS));
          const inscribeJson = {
            p: 'KRC-20',
            op: 'transfer',
            tick: 'KREX',
            amt: amountInSmallestUnit.toString(),
            to: DIAMOND_VEINS_GARAGE_ADDRESS,
          };
          await signKrc20Transfer(
            walletState.provider,
            JSON.stringify(inscribeJson),
            KRC20_TRANSFER_TYPE,
            DIAMOND_VEINS_GARAGE_ADDRESS,
            0.001,
          );
        }
        setTycon((s) => applyEvent(s, { type: 'AddConsumables', itemId, count: 1, at: Date.now() }));
        return true;
      } catch {
        return false;
      } finally {
        setBuyingItemId(null);
      }
    },
    [payKasBestEffort, getKasPriceAfterDiscount, canPayWithL1, walletState.provider, krexL1Balance],
  );

  const feedWorker = useCallback((slotIndex: number, itemId: DiamondVeinsConsumableId) => {
    const item = DIAMOND_VEINS_CONSUMABLES.find((c) => c.id === itemId);
    if (!item) return false;
    const slot = tyconRef.current.slots[slotIndex];
    if (!slot || slot.nftId == null) return false;
    const energyMax = Math.max(slot.energyMax ?? 0, 1);
    const energyRestore = Math.floor(energyMax * item.restorePct);
    setTycon((s) =>
      applyEvent(s, {
        type: 'FeedWorker',
        slotIndex,
        itemId,
        energyRestore,
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
    slotPurchaseKas: getKasPriceAfterDiscount(DIAMOND_VEINS_NFT_SLOT_UNLOCK_COST_KAS),
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
    reconnectRequiredBy: !miningAllowed,
    gridLedger: tycon.gridLedger,
    redeemPoints,
    /** @deprecated */
    redeemGrid: redeemPoints,
    lastPaymentError,
    profileNotice,
  };
}

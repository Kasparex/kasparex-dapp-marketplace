'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKaspaBalance } from '@/hooks/useKaspaBalance';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import type { BonusType } from '@/lib/game/diamond-bonuses';
import {
  KREX_TIER_SHOP_DISCOUNT_PCT,
  DIAMOND_VEINS_GARAGE_ADDRESS,
  REFINE_MIN_DIAMONDS,
  GARAGE_REVENUE_TO_POOL_PCT,
  KRC20_TRANSFER_TYPE,
  KREX_DECIMALS,
  SOMPI_PER_KAS,
  MINING_RUN_OPTIONS,
} from '@/lib/game/diamond-veins-config';
import { fetchNFTMetadata, type ParsedNFTMetadata } from '@/lib/nft/metadata';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import {
  applyEvent,
  applyEvents,
  computeYieldStats,
  computeDiamondDropWeights,
  hydrateTyconState,
  createInitialTyconState,
  type TyconGameState,
  type ActiveBoost,
  type MiningSlot,
} from '@/lib/game/engine';
import { fetchDiamondVeinsServerState, pushDiamondVeinsServerSnapshot, registerGarageReceipt } from '@/lib/game/diamond-veins-api';

export type { MiningSlot, ActiveBoost } from '@/lib/game/engine';

const DIAMOND_VEINS_STORAGE_KEY = 'diamond-veins-state';
const RECONNECT_GRACE_MS = 24 * 60 * 60 * 1000;
const SERVER_SYNC_MS = 2500;

function loadPersistedTycon(): TyconGameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DIAMOND_VEINS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TyconGameState>;
    if (!parsed || typeof parsed !== 'object') return null;
    return hydrateTyconState(parsed);
  } catch {
    return null;
  }
}

function savePersistedTycon(state: TyconGameState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DIAMOND_VEINS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function useDiamondMining() {
  const { state: walletState } = useKaspaWallet();
  const { balanceInKas, refresh: refreshKasBalance, isLoading: kasBalanceHookLoading } = useKaspaBalance();
  const { balance: krexBalance, l1Balance: krexL1Balance, tier: krexTier } = useKREXBalance();

  const [tycon, setTycon] = useState<TyconGameState>(() => loadPersistedTycon() ?? createInitialTyconState());
  const tyconRef = useRef(tycon);
  tyconRef.current = tycon;

  const [slottedMetadata, setSlottedMetadata] = useState<Record<number, ParsedNFTMetadata>>({});
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);
  const [lastRefineClaim, setLastRefineClaim] = useState<{ points: number; amount: number } | null>(null);
  const metaRef = useRef(slottedMetadata);
  metaRef.current = slottedMetadata;

  const canPayWithL1 =
    walletState.isConnected &&
    (walletState.provider === 'kasware' || walletState.provider === 'kastle');

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
    savePersistedTycon(tycon);
  }, [tycon]);

  useEffect(() => {
    if (walletState.isConnected && walletState.address) {
      const now = Date.now();
      setTycon((s) =>
        applyEvent(s, {
          type: 'HeartbeatConnect',
          address: walletState.address!,
          at: now,
        })
      );
    }
  }, [walletState.isConnected, walletState.address]);

  useEffect(() => {
    const addr = walletState.address;
    if (!addr || !walletState.isConnected) return;
    let cancelled = false;
    void (async () => {
      const remote = await fetchDiamondVeinsServerState(addr);
      if (cancelled || !remote) return;
      setTycon((local) => (remote.version > local.version ? hydrateTyconState(remote) : local));
    })();
    return () => {
      cancelled = true;
    };
  }, [walletState.address, walletState.isConnected]);

  useEffect(() => {
    const addr = walletState.address;
    if (!addr || !walletState.isConnected) return;
    const t = setTimeout(() => {
      void pushDiamondVeinsServerSnapshot(addr, tyconRef.current).then((res) => {
        if (res?.state && res.state.version >= tyconRef.current.version) {
          setTycon(hydrateTyconState(res.state));
        }
      });
    }, SERVER_SYNC_MS);
    return () => clearTimeout(t);
  }, [tycon, walletState.address, walletState.isConnected]);

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
    [tycon, krexTier, slottedMetadata]
  );

  const miningAllowed = useMemo(() => {
    if (walletState.isConnected) return true;
    if (tycon.lastConnectedAt == null) return false;
    return Date.now() - tycon.lastConnectedAt <= RECONNECT_GRACE_MS;
  }, [walletState.isConnected, tycon.lastConnectedAt]);

  useEffect(() => {
    if (stats.yieldPerSecond === 0 || !miningAllowed) return;
    const interval = setInterval(() => {
      setTycon((s) => {
        const st = computeYieldStats(s, krexTier, metaRef.current);
        if (st.yieldPerSecond === 0) return s;
        const w = computeDiamondDropWeights(s, metaRef.current);
        return applyEvent(s, {
          type: 'DistributeDiamondDelta',
          delta: st.yieldPerSecond,
          weights: w,
          at: Date.now(),
        });
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stats.yieldPerSecond, miningAllowed, krexTier, tycon.slots, tycon.activeBoosts, tycon.machines, tycon.powerCapMw, tycon.miningRunEndTime, tycon.miningRunMultiplier]);

  const deployNFT = useCallback((slotIndex: number, nftId: number, collection: string) => {
    setTycon((s) =>
      applyEvent(s, {
        type: 'DeployNFT',
        slotIndex,
        nftId,
        collection,
      })
    );
    (window as Window & { dispatchEvent: typeof window.dispatchEvent }).dispatchEvent(
      new CustomEvent('record-transaction', {
        detail: {
          type: 'deploy-nft',
          collection,
          id: nftId,
          cost: 0.01,
          status: 'completed',
        },
      })
    );
  }, []);

  const removeSlot = useCallback((slotIndex: number) => {
    setTycon((s) => applyEvent(s, { type: 'RemoveSlot', slotIndex }));
  }, []);

  const refineDiamonds = useCallback(async (): Promise<{ points: number; amount: number } | null> => {
    const prev = tyconRef.current;
    if (prev.diamonds < REFINE_MIN_DIAMONDS) return null;
    const at = Date.now();
    const next = applyEvent(prev, { type: 'Refine', at });
    const lastEntry = next.gridLedger[next.gridLedger.length - 1];
    const refinementPoints = lastEntry?.refinementPoints ?? 0;
    const amount = lastEntry?.diamondsRefined ?? Math.floor(prev.diamonds);

    (window as Window & { dispatchEvent: typeof window.dispatchEvent }).dispatchEvent(
      new CustomEvent('record-transaction', {
        detail: {
          type: 'diamond-refine',
          amount,
          refinementPoints,
          status: 'completed',
          userAddress: walletState.address ?? undefined,
        },
      })
    );

    const syntheticTx =
      typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
        ? Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('')
        : `${at}`.padStart(64, '0');
    void fetch('/api/rewards/l1/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txHash: syntheticTx,
        userAddress: walletState.address ?? '',
        dappId: 'diamond-veins',
        actionType: 'refine',
        actionValue: refinementPoints,
        network: 'L1' as const,
      }),
    }).catch(() => {});

    setTycon(next);
    setLastRefineClaim({ points: refinementPoints, amount });
    return { points: refinementPoints, amount };
  }, [walletState.address]);

  const getKasPriceAfterDiscount = useCallback(
    (priceKas: number) => {
      const discountPct = KREX_TIER_SHOP_DISCOUNT_PCT[krexTier] ?? 0;
      const discounted = priceKas * (1 - discountPct / 100);
      // Keep KAS pricing stable; UI will format to 4 decimals.
      return Math.max(0, Math.round(discounted * 10_000) / 10_000);
    },
    [krexTier]
  );

  const applyGaragePurchase = useCallback(
    async (
      itemId: string,
      name: string,
      type: BonusType,
      multiplier: number,
      txHash: string,
      currency: 'KREX' | 'KAS',
      amount: number
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
        ])
      );
    },
    [walletState.address]
  );

  const buyBoost = useCallback(
    async (itemId: string, name: string, priceKrex: number, type: BonusType, multiplier: number) => {
      const canPayL1 = walletState.isConnected && canPayWithL1 && walletState.provider;
      if (!canPayL1) {
        console.warn('[Diamond Veins] Connect KasWare or Kastle (L1) for Garage purchase');
        return;
      }
      if (krexL1Balance < priceKrex) {
        return;
      }

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
        const inscribeJsonString = JSON.stringify(inscribeJson);
        const priorityFeeKAS = 0.001;

        const txHash = await signKrc20Transfer(
          walletState.provider!,
          inscribeJsonString,
          KRC20_TRANSFER_TYPE,
          DIAMOND_VEINS_GARAGE_ADDRESS,
          priorityFeeKAS
        );

        (window as Window & { dispatchEvent: typeof window.dispatchEvent }).dispatchEvent(
          new CustomEvent('record-transaction', {
            detail: {
              type: 'garage-purchase',
              item: name,
              cost: priceKrex,
              txHash,
              revenuePoolShare: GARAGE_REVENUE_TO_POOL_PCT,
              status: 'completed',
            },
          })
        );

        await applyGaragePurchase(itemId, name, type, multiplier, txHash, 'KREX', priceKrex);
      } catch (err) {
        console.error('[Diamond Veins] Garage purchase failed:', err);
        throw err;
      } finally {
        setBuyingItemId(null);
      }
    },
    [walletState.isConnected, canPayWithL1, walletState.provider, krexL1Balance, applyGaragePurchase]
  );

  const buyBoostWithKAS = useCallback(
    async (itemId: string, name: string, priceKAS: number, type: BonusType, multiplier: number) => {
      const priceAfterDiscountKas = getKasPriceAfterDiscount(priceKAS);
      const canPayL1 = walletState.isConnected && canPayWithL1 && walletState.provider;
      if (!canPayL1) {
        console.warn('[Diamond Veins] Connect KasWare or Kastle (L1) for Garage purchase');
        return;
      }
      if (kasBalance < priceAfterDiscountKas) return;

      setBuyingItemId(itemId);

      try {
        const sompi = Math.round(priceAfterDiscountKas * SOMPI_PER_KAS);
        const to = DIAMOND_VEINS_GARAGE_ADDRESS.replace(/^kaspa:/i, '');
        const sent = await sendKaspaTransaction(walletState.provider!, {
          to,
          amount: String(sompi),
        });
        if (sent.status === 'failed') {
          throw new Error(sent.error || 'KAS transfer failed');
        }
        const txHash = sent.txHash;

        (window as Window & { dispatchEvent: typeof window.dispatchEvent }).dispatchEvent(
          new CustomEvent('record-transaction', {
            detail: {
              type: 'garage-purchase',
              item: name,
              costKAS: priceAfterDiscountKas,
              txHash,
              revenuePoolShare: GARAGE_REVENUE_TO_POOL_PCT,
              status: 'completed',
            },
          })
        );

        await applyGaragePurchase(itemId, name, type, multiplier, txHash, 'KAS', priceAfterDiscountKas);
        void refreshKasBalance();
      } catch (err) {
        console.error('[Diamond Veins] Garage KAS purchase failed:', err);
        throw err;
      } finally {
        setBuyingItemId(null);
      }
    },
    [walletState.isConnected, canPayWithL1, walletState.provider, kasBalance, refreshKasBalance, applyGaragePurchase, getKasPriceAfterDiscount]
  );

  const startMiningRun = useCallback((optionIndex: number) => {
    const opt = MINING_RUN_OPTIONS[optionIndex];
    if (!opt) return;
    const now = Date.now();
    setTycon((s) =>
      applyEvent(s, {
        type: 'StartMiningRun',
        optionIndex,
        at: now,
        durationMs: opt.durationMs,
        mult: opt.mult,
      })
    );
  }, []);

  const setAutoRestartMiningRun = useCallback((enabled: boolean) => {
    setTycon((s) => applyEvent(s, { type: 'SetAutomation', patch: { autoRestartMiningRun: enabled } }));
  }, []);

  const buyExtraDrill = useCallback(() => {
    setTycon((s) =>
      applyEvent(s, {
        type: 'AddMachine',
        machine: { id: 'surface-drill-mk1', count: 1, powerPerUnit: 2, yieldPerUnit: 0.12 },
      })
    );
  }, []);

  const buyPowerUpgrade = useCallback(() => {
    setTycon((s) => applyEvent(s, { type: 'UpgradePower', addedMw: 4 }));
  }, []);

  return {
    tycon,
    diamonds: tycon.diamonds,
    diamondInventory: tycon.diamondInventory,
    slots: tycon.slots,
    stats,
    activeBoosts: tycon.activeBoosts,
    deployNFT,
    removeSlot,
    refineDiamonds,
    buyBoost,
    buyBoostWithKAS,
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
    lastRefineClaim,
    clearLastRefineClaim: () => setLastRefineClaim(null),
    kasBalanceLoading: canPayWithL1 && kasBalanceHookLoading && balanceInKas === null,
    refreshKasBalance,
    miningRun:
      tycon.miningRunEndTime > Date.now()
        ? {
            endTime: tycon.miningRunEndTime,
            multiplier: tycon.miningRunMultiplier,
            optionIndex: tycon.miningRunOptionIndex,
            option: tycon.miningRunOptionIndex != null ? MINING_RUN_OPTIONS[tycon.miningRunOptionIndex] : null,
          }
        : null,
    startMiningRun,
    miningRunOptions: MINING_RUN_OPTIONS,
    miningAllowed,
    reconnectRequiredBy:
      tycon.lastConnectedAt != null &&
      !walletState.isConnected &&
      Date.now() - tycon.lastConnectedAt > RECONNECT_GRACE_MS,
    machines: tycon.machines,
    powerCapMw: tycon.powerCapMw,
    automation: tycon.automation,
    gridLedger: tycon.gridLedger,
    setAutoRestartMiningRun,
    buyExtraDrill,
    buyPowerUpgrade,
  };
}

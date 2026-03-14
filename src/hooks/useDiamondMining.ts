'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKasWare } from '@/hooks/useKasWare';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { BASE_YIELDS, getBonusForTrait, getNFTTier, type BonusType } from '@/lib/game/diamond-bonuses';
import {
  WORKER_TIER_MULTIPLIERS,
  OPERATOR_TIER_MULTIPLIERS,
  KREX_TIER_YIELD_BONUS_PCT,
  KREX_TIER_SHOP_DISCOUNT_PCT,
  DIAMOND_VEINS_GARAGE_ADDRESS,
  REFINE_MIN_DIAMONDS,
  GARAGE_REVENUE_TO_POOL_PCT,
  KRC20_TRANSFER_TYPE,
  KREX_DECIMALS,
  SOMPI_PER_KAS,
  MINING_RUN_OPTIONS,
  WORKER_TIER_MULTIPLIERS,
  OPERATOR_TIER_MULTIPLIERS,
} from '@/lib/game/diamond-veins-config';
import { fetchNFTMetadata, type ParsedNFTMetadata } from '@/lib/nft/metadata';
import { getKasWare, signKRC20Transaction } from '@/lib/kaspa/kasware';

export interface MiningSlot {
  type: 'worker' | 'operator' | 'booster';
  nftId: number | null;
  collection: string | null;
}

export interface ActiveBoost {
  id: string;
  type: BonusType;
  multiplier: number;
  endTime: number;
  name?: string;
  pendingVerification?: boolean;
  txHash?: string;
}

const SOMPI_PER_KAS_FACTOR = 100_000_000;

export function useDiamondMining() {
  const { state: walletState } = useKaspaWallet();
  const { sendTransaction: sendKAS, balance: kasBalanceStr } = useKasWare();
  const { nfts } = useNFTStatus();
  const { balance: krexBalance, l1Balance: krexL1Balance, tier: krexTier } = useKREXBalance();
  const [kasBalanceFetched, setKasBalanceFetched] = useState<number | null>(null);

  const isKasWare =
    (typeof window !== 'undefined' && walletState.isConnected && !!(window as any).kasware) ||
    walletState.provider?.toLowerCase() === 'kasware';
  const canPayWithL1 = !!(walletState.isConnected && isKasWare);

  const fetchKasBalance = useCallback(() => {
    if (!canPayWithL1) return;
    const w = getKasWare();
    if (!w || typeof w.getBalance !== 'function') return;
    w.getBalance()
      .then((res) => {
        if (res == null) return;
        let val: number;
        if (typeof res === 'object' && 'balance' in res) val = Number((res as { balance: string | number }).balance);
        else if (typeof res === 'object' && 'amount' in res) val = Number((res as { amount: string | number }).amount);
        else val = Number(res);
        if (Number.isNaN(val) || val < 0) return;
        const strVal = val.toString();
        const hasDecimals = strVal.includes('.');
        const decimalPlaces = hasDecimals ? strVal.split('.')[1]?.length || 0 : 0;
        const kas = val < 0.01 && decimalPlaces > 6 ? val : val / SOMPI_PER_KAS_FACTOR;
        setKasBalanceFetched(kas);
      })
      .catch(() => {});
  }, [canPayWithL1]);

  useEffect(() => {
    if (!canPayWithL1) {
      setKasBalanceFetched(null);
      return;
    }
    fetchKasBalance();
    const t = setInterval(() => {
      fetchKasBalance();
    }, 2500);
    return () => clearInterval(t);
  }, [canPayWithL1, fetchKasBalance]);

  const kasBalance = kasBalanceFetched ?? (kasBalanceStr != null ? parseFloat(String(kasBalanceStr)) : 0);

  const [slots, setSlots] = useState<MiningSlot[]>([
    { type: 'worker', nftId: null, collection: 'KREXPRIME' },
    { type: 'operator', nftId: null, collection: 'PIXELKREX' },
    { type: 'booster', nftId: null, collection: null },
  ]);

  const [slottedMetadata, setSlottedMetadata] = useState<Record<number, ParsedNFTMetadata>>({});
  const [diamonds, setDiamonds] = useState<number>(0);
  const [activeBoosts, setActiveBoosts] = useState<ActiveBoost[]>([]);
  const [lastRefinedAt, setLastRefinedAt] = useState<number>(Date.now());
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);
  const [refinementPointsTotal, setRefinementPointsTotal] = useState<number>(0);
  const [lastRefineClaim, setLastRefineClaim] = useState<{ points: number; amount: number } | null>(null);
  const [miningRunEndTime, setMiningRunEndTime] = useState<number>(0);
  const [miningRunMultiplier, setMiningRunMultiplier] = useState<number>(1);
  const [miningRunOptionIndex, setMiningRunOptionIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      for (const slot of slots) {
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

    fetchMetadata();
  }, [slots, slottedMetadata]);

  const stats = useMemo(() => {
    let yieldPerSecond = 0;
    let totalMultiplier = 1;

    const workerSlot = slots.find((s) => s.type === 'worker');
    if (workerSlot && workerSlot.nftId !== null && workerSlot.collection) {
      const baseYield = BASE_YIELDS.WORKER_BASE;
      const meta = slottedMetadata[workerSlot.nftId];
      const tier = getNFTTier(workerSlot.collection, workerSlot.nftId, meta);
      const tierMult = WORKER_TIER_MULTIPLIERS[tier];
      yieldPerSecond = baseYield * tierMult;

      meta?.traits?.forEach((trait) => {
        const bonus = getBonusForTrait(String(trait.value));
        if (bonus?.type === 'yield') yieldPerSecond += BASE_YIELDS.WORKER_BASE * bonus.value;
        if (bonus?.type === 'efficiency') yieldPerSecond += BASE_YIELDS.WORKER_BASE * (bonus.value / 2);
      });
    }

    const operatorSlot = slots.find((s) => s.type === 'operator');
    if (operatorSlot && operatorSlot.nftId !== null && operatorSlot.collection) {
      const meta = slottedMetadata[operatorSlot.nftId];
      const tier = getNFTTier(operatorSlot.collection, operatorSlot.nftId, meta);
      const tierMult = OPERATOR_TIER_MULTIPLIERS[tier];
      totalMultiplier *= tierMult;

      meta?.traits?.forEach((trait) => {
        const bonus = getBonusForTrait(String(trait.value));
        if (bonus?.type === 'speed') totalMultiplier += bonus.value;
      });
    }

    const krexBonusPct = KREX_TIER_YIELD_BONUS_PCT[krexTier] ?? 0;
    const krexMult = 1 + krexBonusPct / 100;
    yieldPerSecond *= krexMult;

    const now = Date.now();
    activeBoosts.forEach((boost) => {
      if (boost.endTime > now) {
        if (boost.type === 'yield') yieldPerSecond *= 1 + boost.multiplier;
        if (boost.type === 'speed') totalMultiplier *= 1 + boost.multiplier;
        if (boost.type === 'efficiency') yieldPerSecond *= 1 + boost.multiplier;
        if (boost.type === 'luck') totalMultiplier *= 1 + boost.multiplier;
      }
    });

    let finalYield = yieldPerSecond * totalMultiplier;
    if (miningRunEndTime > now) finalYield *= miningRunMultiplier;

    return {
      yieldPerSecond: finalYield,
      totalMultiplier,
      rawYield: yieldPerSecond,
    };
  }, [slots, slottedMetadata, activeBoosts, krexTier, miningRunEndTime, miningRunMultiplier]);

  useEffect(() => {
    if (stats.yieldPerSecond === 0) return;

    const interval = setInterval(() => {
      setDiamonds((prev) => prev + stats.yieldPerSecond);
    }, 1000);

    return () => clearInterval(interval);
  }, [stats.yieldPerSecond]);

  const deployNFT = useCallback((slotIndex: number, nftId: number, collection: string) => {
    setSlots((prev) => {
      const newSlots = [...prev];
      newSlots[slotIndex] = { ...newSlots[slotIndex], nftId, collection };
      return newSlots;
    });

    (window as any).dispatchEvent(
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
    setSlots((prev) => {
      const newSlots = [...prev];
      newSlots[slotIndex] = { ...newSlots[slotIndex], nftId: null, collection: newSlots[slotIndex].type === 'worker' ? 'KREXPRIME' : newSlots[slotIndex].type === 'operator' ? 'PIXELKREX' : null };
      return newSlots;
    });
  }, []);

  const refineDiamonds = useCallback(async (): Promise<{ points: number; amount: number } | null> => {
    if (diamonds < REFINE_MIN_DIAMONDS) return null;

    const amount = Math.floor(diamonds);
    const timeSinceLastRefine = (Date.now() - lastRefinedAt) / 1000;
    const refinementPoints = Math.floor(amount * (1 + Math.min(timeSinceLastRefine / 3600, 0.5)));

    (window as any).dispatchEvent(
      new CustomEvent('record-transaction', {
        detail: {
          type: 'diamond-refine',
          amount,
          refinementPoints,
          status: 'completed',
        },
      })
    );

    setDiamonds(0);
    setLastRefinedAt(Date.now());
    setRefinementPointsTotal((prev) => prev + refinementPoints);
    setLastRefineClaim({ points: refinementPoints, amount });
    return { points: refinementPoints, amount };
  }, [diamonds, lastRefinedAt]);

  const getPriceAfterDiscount = useCallback(
    (priceKrex: number) => {
      const discountPct = KREX_TIER_SHOP_DISCOUNT_PCT[krexTier] ?? 0;
      return Math.max(0, Math.floor(priceKrex * (1 - discountPct / 100)));
    },
    [krexTier]
  );

  const buyBoost = useCallback(
    async (itemId: string, name: string, priceKrex: number, type: BonusType, multiplier: number) => {
      const priceAfterDiscount = getPriceAfterDiscount(priceKrex);
      const canPayL1 = walletState.isConnected && isKasWare;
      if (!canPayL1) {
        console.warn('[Diamond Veins] L1 KasWare required for Garage purchase');
        return;
      }
      if (krexL1Balance < priceAfterDiscount) {
        return;
      }

      setBuyingItemId(itemId);

      try {
        const amountInSmallestUnit = Math.floor(priceAfterDiscount * Math.pow(10, KREX_DECIMALS));
        const inscribeJson = {
          p: 'KRC-20',
          op: 'transfer',
          tick: 'KREX',
          amt: amountInSmallestUnit.toString(),
          to: DIAMOND_VEINS_GARAGE_ADDRESS,
        };
        const inscribeJsonString = JSON.stringify(inscribeJson);
        const priorityFeeKAS = 0.001;

        const txHash = await signKRC20Transaction(
          inscribeJsonString,
          KRC20_TRANSFER_TYPE,
          DIAMOND_VEINS_GARAGE_ADDRESS,
          priorityFeeKAS
        );

        const boost: ActiveBoost = {
          id: `${itemId}-${Date.now()}`,
          type,
          multiplier,
          endTime: Date.now() + 3600000,
          name,
          pendingVerification: true,
          txHash,
        };

        (window as any).dispatchEvent(
          new CustomEvent('record-transaction', {
            detail: {
              type: 'garage-purchase',
              item: name,
              cost: priceAfterDiscount,
              txHash,
              revenuePoolShare: GARAGE_REVENUE_TO_POOL_PCT,
              status: 'completed',
            },
          })
        );

        setActiveBoosts((prev) => [...prev, boost]);
      } catch (err) {
        console.error('[Diamond Veins] Garage purchase failed:', err);
        throw err;
      } finally {
        setBuyingItemId(null);
      }
    },
    [walletState.isConnected, isKasWare, krexL1Balance, getPriceAfterDiscount]
  );

  const buyBoostWithKAS = useCallback(
    async (itemId: string, name: string, priceKAS: number, type: BonusType, multiplier: number) => {
      const canPayL1 = walletState.isConnected && isKasWare;
      if (!canPayL1) {
        console.warn('[Diamond Veins] L1 KasWare required for Garage purchase');
        return;
      }
      if (kasBalance < priceKAS) return;

      setBuyingItemId(itemId);

      try {
        const sompi = Math.round(priceKAS * SOMPI_PER_KAS);
        const txHash = await sendKAS(DIAMOND_VEINS_GARAGE_ADDRESS, sompi);

        const boost: ActiveBoost = {
          id: `${itemId}-${Date.now()}`,
          type,
          multiplier,
          endTime: Date.now() + 3600000,
          name,
          pendingVerification: true,
          txHash,
        };

        (window as any).dispatchEvent(
          new CustomEvent('record-transaction', {
            detail: {
              type: 'garage-purchase',
              item: name,
              costKAS: priceKAS,
              txHash,
              revenuePoolShare: GARAGE_REVENUE_TO_POOL_PCT,
              status: 'completed',
            },
          })
        );

        setActiveBoosts((prev) => [...prev, boost]);
        fetchKasBalance();
      } catch (err) {
        console.error('[Diamond Veins] Garage KAS purchase failed:', err);
        throw err;
      } finally {
        setBuyingItemId(null);
      }
    },
    [walletState.isConnected, isKasWare, kasBalance, sendKAS, fetchKasBalance]
  );

  return {
    diamonds,
    slots,
    stats,
    activeBoosts,
    deployNFT,
    refineDiamonds,
    buyBoost,
    buyBoostWithKAS,
    kasBalance,
    isConnected: walletState.isConnected,
    slottedMetadata,
    krexBalance,
    krexL1Balance,
    krexTier,
    getPriceAfterDiscount,
    refineMinDiamonds: REFINE_MIN_DIAMONDS,
    revenuePoolPct: Math.round(GARAGE_REVENUE_TO_POOL_PCT * 100),
    buyingItemId,
    canPayWithL1,
    refinementPointsTotal,
    lastRefineClaim,
    clearLastRefineClaim: () => setLastRefineClaim(null),
    kasBalanceLoading: canPayWithL1 && kasBalanceFetched === null && (kasBalanceStr === null || kasBalanceStr === undefined),
    refreshKasBalance: fetchKasBalance,
    removeSlot,
    miningRun: miningRunEndTime > Date.now() ? { endTime: miningRunEndTime, multiplier: miningRunMultiplier, optionIndex: miningRunOptionIndex, option: miningRunOptionIndex != null ? MINING_RUN_OPTIONS[miningRunOptionIndex] : null } : null,
    startMiningRun: (optionIndex: number) => {
      const opt = MINING_RUN_OPTIONS[optionIndex];
      if (opt) {
        setMiningRunEndTime(Date.now() + opt.durationMs);
        setMiningRunMultiplier(opt.mult);
        setMiningRunOptionIndex(optionIndex);
      }
    },
    miningRunOptions: MINING_RUN_OPTIONS,
  };
}

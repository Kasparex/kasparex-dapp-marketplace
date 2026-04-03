'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKaspaBalance } from '@/hooks/useKaspaBalance';
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
} from '@/lib/game/diamond-veins-config';
import { fetchNFTMetadata, type ParsedNFTMetadata } from '@/lib/nft/metadata';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';

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

const DIAMOND_VEINS_STORAGE_KEY = 'diamond-veins-state';
const RECONNECT_GRACE_MS = 24 * 60 * 60 * 1000; // 24h – must reconnect at least once per day for mining to continue

interface PersistedMiningState {
  slots: MiningSlot[];
  diamonds: number;
  lastRefinedAt: number;
  refinementPointsTotal: number;
  miningRunEndTime: number;
  miningRunMultiplier: number;
  miningRunOptionIndex: number | null;
  activeBoosts: ActiveBoost[];
  lastConnectedAt: number | null;
  lastConnectedAddress: string | null;
}

function loadPersistedState(): Partial<PersistedMiningState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DIAMOND_VEINS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedMiningState;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePersistedState(state: PersistedMiningState) {
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
  const { nfts } = useNFTStatus();
  const { balance: krexBalance, l1Balance: krexL1Balance, tier: krexTier } = useKREXBalance();

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

  const defaultSlots: MiningSlot[] = [
    { type: 'worker', nftId: null, collection: 'KREXPRIME' },
    { type: 'operator', nftId: null, collection: 'PIXELKREX' },
    { type: 'booster', nftId: null, collection: null },
  ];

  const [slots, setSlots] = useState<MiningSlot[]>(() => {
    const p = loadPersistedState();
    if (p?.slots && Array.isArray(p.slots) && p.slots.length >= 3) return p.slots;
    return defaultSlots;
  });
  const [slottedMetadata, setSlottedMetadata] = useState<Record<number, ParsedNFTMetadata>>({});
  const [diamonds, setDiamonds] = useState<number>(() => {
    const p = loadPersistedState();
    if (p != null && typeof p.diamonds === 'number' && p.diamonds >= 0) return p.diamonds;
    return 0;
  });
  const [activeBoosts, setActiveBoosts] = useState<ActiveBoost[]>(() => {
    const p = loadPersistedState();
    if (p?.activeBoosts && Array.isArray(p.activeBoosts)) return p.activeBoosts;
    return [];
  });
  const [lastRefinedAt, setLastRefinedAt] = useState<number>(() => {
    const p = loadPersistedState();
    if (p?.lastRefinedAt != null && typeof p.lastRefinedAt === 'number') return p.lastRefinedAt;
    return Date.now();
  });
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);
  const [refinementPointsTotal, setRefinementPointsTotal] = useState<number>(() => {
    const p = loadPersistedState();
    if (p != null && typeof p.refinementPointsTotal === 'number' && p.refinementPointsTotal >= 0) return p.refinementPointsTotal;
    return 0;
  });
  const [lastRefineClaim, setLastRefineClaim] = useState<{ points: number; amount: number } | null>(null);
  const [miningRunEndTime, setMiningRunEndTime] = useState<number>(() => {
    const p = loadPersistedState();
    if (p?.miningRunEndTime != null && typeof p.miningRunEndTime === 'number') return p.miningRunEndTime;
    return 0;
  });
  const [miningRunMultiplier, setMiningRunMultiplier] = useState<number>(() => {
    const p = loadPersistedState();
    if (p?.miningRunMultiplier != null && typeof p.miningRunMultiplier === 'number') return p.miningRunMultiplier;
    return 1;
  });
  const [miningRunOptionIndex, setMiningRunOptionIndex] = useState<number | null>(() => {
    const p = loadPersistedState();
    if (p?.miningRunOptionIndex != null && typeof p.miningRunOptionIndex === 'number') return p.miningRunOptionIndex;
    return null;
  });
  const [lastConnectedAt, setLastConnectedAt] = useState<number | null>(() => {
    const p = loadPersistedState();
    if (p?.lastConnectedAt != null && typeof p.lastConnectedAt === 'number') return p.lastConnectedAt;
    return null;
  });
  const [lastConnectedAddress, setLastConnectedAddress] = useState<string | null>(() => {
    const p = loadPersistedState();
    if (p?.lastConnectedAddress != null && typeof p.lastConnectedAddress === 'string') return p.lastConnectedAddress;
    return null;
  });

  // When wallet connects, update last-connected time for 24h mining grace
  useEffect(() => {
    if (walletState.isConnected && walletState.address) {
      const now = Date.now();
      setLastConnectedAt(now);
      setLastConnectedAddress(walletState.address);
    }
  }, [walletState.isConnected, walletState.address]);

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

  // Mining continues when connected or within 24h of last connect (reconnect-at-least-once-per-day rule)
  const miningAllowed = useMemo(() => {
    if (walletState.isConnected) return true;
    if (lastConnectedAt == null) return false;
    return Date.now() - lastConnectedAt <= RECONNECT_GRACE_MS;
  }, [walletState.isConnected, lastConnectedAt]);

  useEffect(() => {
    if (stats.yieldPerSecond === 0 || !miningAllowed) return;

    const interval = setInterval(() => {
      setDiamonds((prev) => prev + stats.yieldPerSecond);
    }, 1000);

    return () => clearInterval(interval);
  }, [stats.yieldPerSecond, miningAllowed]);

  // Persist state so mining and counts survive refresh and disconnect
  useEffect(() => {
    savePersistedState({
      slots,
      diamonds,
      lastRefinedAt,
      refinementPointsTotal,
      miningRunEndTime,
      miningRunMultiplier,
      miningRunOptionIndex,
      activeBoosts,
      lastConnectedAt,
      lastConnectedAddress,
    });
  }, [slots, diamonds, lastRefinedAt, refinementPointsTotal, miningRunEndTime, miningRunMultiplier, miningRunOptionIndex, activeBoosts, lastConnectedAt, lastConnectedAddress]);

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
          userAddress: walletState.address ?? undefined,
        },
      })
    );

    setDiamonds(0);
    setLastRefinedAt(Date.now());
    setRefinementPointsTotal((prev) => prev + refinementPoints);
    setLastRefineClaim({ points: refinementPoints, amount });
    return { points: refinementPoints, amount };
  }, [diamonds, lastRefinedAt, walletState.address]);

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
      const canPayL1 = walletState.isConnected && canPayWithL1 && walletState.provider;
      if (!canPayL1) {
        console.warn('[Diamond Veins] Connect KasWare or Kastle (L1) for Garage purchase');
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

        const txHash = await signKrc20Transfer(
          walletState.provider!,
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
    [walletState.isConnected, canPayWithL1, walletState.provider, krexL1Balance, getPriceAfterDiscount]
  );

  const buyBoostWithKAS = useCallback(
    async (itemId: string, name: string, priceKAS: number, type: BonusType, multiplier: number) => {
      const canPayL1 = walletState.isConnected && canPayWithL1 && walletState.provider;
      if (!canPayL1) {
        console.warn('[Diamond Veins] Connect KasWare or Kastle (L1) for Garage purchase');
        return;
      }
      if (kasBalance < priceKAS) return;

      setBuyingItemId(itemId);

      try {
        const sompi = Math.round(priceKAS * SOMPI_PER_KAS);
        const to = DIAMOND_VEINS_GARAGE_ADDRESS.replace(/^kaspa:/i, '');
        const sent = await sendKaspaTransaction(walletState.provider!, {
          to,
          amount: String(sompi),
        });
        if (sent.status === 'failed') {
          throw new Error(sent.error || 'KAS transfer failed');
        }
        const txHash = sent.txHash;

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
        void refreshKasBalance();
      } catch (err) {
        console.error('[Diamond Veins] Garage KAS purchase failed:', err);
        throw err;
      } finally {
        setBuyingItemId(null);
      }
    },
    [walletState.isConnected, canPayWithL1, walletState.provider, kasBalance, refreshKasBalance]
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
    kasBalanceLoading: canPayWithL1 && kasBalanceHookLoading && balanceInKas === null,
    refreshKasBalance,
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
    miningAllowed,
    reconnectRequiredBy: lastConnectedAt != null && !walletState.isConnected && Date.now() - lastConnectedAt > RECONNECT_GRACE_MS,
  };
}

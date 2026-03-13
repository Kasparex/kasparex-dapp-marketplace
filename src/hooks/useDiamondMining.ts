import { useState, useEffect, useMemo, useCallback } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { BASE_YIELDS, getBonusForTrait, type BonusType } from '@/lib/game/diamond-bonuses';
import { fetchNFTMetadata, type ParsedNFTMetadata } from '@/lib/nft/metadata';

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
}

export function useDiamondMining() {
  const { state: walletState } = useKaspaWallet();
  const { nfts } = useNFTStatus();

  // Slots State
  const [slots, setSlots] = useState<MiningSlot[]>([
    { type: 'worker', nftId: null, collection: 'KREXPRIME' },
    { type: 'operator', nftId: null, collection: 'PIXELKREX' },
    { type: 'booster', nftId: null, collection: null },
  ]);

  const [slottedMetadata, setSlottedMetadata] = useState<Record<number, ParsedNFTMetadata>>({});
  const [diamonds, setDiamonds] = useState<number>(0);
  const [activeBoosts, setActiveBoosts] = useState<ActiveBoost[]>([]);
  const [lastRefinedAt, setLastRefinedAt] = useState<number>(Date.now());

  // Fetch metadata for new slotted NFTs
  useEffect(() => {
    const fetchMetadata = async () => {
      for (const slot of slots) {
        if (slot.nftId !== null && !slottedMetadata[slot.nftId] && slot.collection) {
          try {
            const meta = await fetchNFTMetadata(slot.collection, slot.nftId);
            if (meta) {
              setSlottedMetadata(prev => ({ ...prev, [slot.nftId!]: meta }));
            }
          } catch (e) {
            console.error('Failed to fetch metadata for slot', slot.nftId, e);
          }
        }
      }
    };

    fetchMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  // Calculate Current Yield
  const stats = useMemo(() => {
    let yieldPerSecond = 0;
    let totalMultiplier = 1;

    // 1. Worker Contribution (Base Yield)
    const workerSlot = slots.find(s => s.type === 'worker');
    if (workerSlot?.nftId !== null) {
      yieldPerSecond = BASE_YIELDS.WORKER_BASE;
      
      // Check for trait bonuses in worker
      const meta = slottedMetadata[workerSlot.nftId];
      meta?.traits?.forEach(trait => {
          const bonus = getBonusForTrait(String(trait.value));
          if (bonus?.type === 'yield') yieldPerSecond += (BASE_YIELDS.WORKER_BASE * bonus.value);
          if (bonus?.type === 'efficiency') yieldPerSecond += (BASE_YIELDS.WORKER_BASE * (bonus.value / 2));
      });
    }

    // 2. Operator Contribution (Multiplier)
    const operatorSlot = slots.find(s => s.type === 'operator');
    if (operatorSlot?.nftId !== null) {
      totalMultiplier *= BASE_YIELDS.OPERATOR_MULTIPLIER_BASE;
      
      const meta = slottedMetadata[operatorSlot.nftId];
      meta?.traits?.forEach(trait => {
          const bonus = getBonusForTrait(String(trait.value));
          if (bonus?.type === 'speed') totalMultiplier += bonus.value;
      });
    }

    // 4. Shop Boosts
    const now = Date.now();
    activeBoosts.forEach(boost => {
      if (boost.endTime > now) {
        if (boost.type === 'yield') yieldPerSecond *= (1 + boost.multiplier);
        if (boost.type === 'speed') totalMultiplier *= (1 + boost.multiplier);
      }
    });

    return {
      yieldPerSecond: yieldPerSecond * totalMultiplier,
      totalMultiplier,
      rawYield: yieldPerSecond
    };
  }, [slots, slottedMetadata, activeBoosts]);

  // Idle Mining Tick
  useEffect(() => {
    if (stats.yieldPerSecond === 0) return;

    const interval = setInterval(() => {
      setDiamonds(prev => prev + stats.yieldPerSecond);
    }, 1000);

    return () => clearInterval(interval);
  }, [stats.yieldPerSecond]);

  const deployNFT = useCallback((slotIndex: number, nftId: number, collection: string) => {
    setSlots(prev => {
      const newSlots = [...prev];
      newSlots[slotIndex] = { ...newSlots[slotIndex], nftId, collection };
      return newSlots;
    });

    // Simulate a deployment transaction record
    (window as any).dispatchEvent(new CustomEvent('record-transaction', {
      detail: {
        type: 'deploy-nft',
        collection,
        id: nftId,
        cost: 0.01,
        status: 'completed'
      }
    }));
  }, []);

  const refineDiamonds = useCallback(async () => {
    if (diamonds < 100) return;

    // Simulate refinement transaction
    (window as any).dispatchEvent(new CustomEvent('record-transaction', {
        detail: {
            type: 'diamond-refine',
            amount: diamonds,
            reward: diamonds / 1000, // mock KREX reward
            status: 'pending'
        }
    }));

    setDiamonds(0);
    setLastRefinedAt(Date.now());
  }, [diamonds]);

  const buyBoost = useCallback((name: string, price: number, type: BonusType, multiplier: number) => {
      const boost: ActiveBoost = {
          id: Math.random().toString(36).substr(2, 9),
          type,
          multiplier,
          endTime: Date.now() + 3600000 // 1 hour
      };

      (window as any).dispatchEvent(new CustomEvent('record-transaction', {
        detail: {
            type: 'garage-purchase',
            item: name,
            cost: price,
            status: 'completed'
        }
      }));

      setActiveBoosts(prev => [...prev, boost]);
  }, []);

  return {
    diamonds,
    slots,
    stats,
    activeBoosts,
    deployNFT,
    refineDiamonds,
    buyBoost,
    isConnected: walletState.isConnected,
    slottedMetadata
  };
}

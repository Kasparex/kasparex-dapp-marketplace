'use client';

import type { TyconGameState, YieldStats } from '@/lib/game/engine';
import { KX_PROSE, KX_PROSE_PARAGRAPH } from '@/lib/ui/kxTypography';
import { GAME_OVERVIEW_H2, GAME_OVERVIEW_H3 } from '@/components/games/panels/GameOverviewSections';

export function OverviewPanel({ tycon: _tycon, stats: _stats }: { tycon: TyconGameState; stats: YieldStats }) {
  return (
    <article className={KX_PROSE}>
      <h2 className={GAME_OVERVIEW_H2}>How rewards work</h2>
      <p className={KX_PROSE_PARAGRAPH}>
        Diamond Veins is an idle miner: assign Workers, Operators, or Foremen to NFT slots (first Worker free), keep them
        fed, refine Diamonds into Hub redeem points from the Game Deck.
      </p>
      <h3 className={GAME_OVERVIEW_H3}>1. Slot &amp; Mine</h3>
      <p className={KX_PROSE_PARAGRAPH}>
        Place an NFT in a slot. Higher tiers mine faster and last longer. Buy extra slots when you are ready to scale
        capacity.
      </p>
      <h3 className={GAME_OVERVIEW_H3}>2. Feed &amp; Refine</h3>
      <p className={KX_PROSE_PARAGRAPH}>
        Restore energy with Shop consumables, then refine Diamonds into Hub points from the Game Deck.
      </p>
      <h3 className={GAME_OVERVIEW_H3}>3. Hub Rewards</h3>
      <p className={KX_PROSE_PARAGRAPH}>
        Spend Hub points on the Rewards catalog. The same bridge is used by Minecore and other Kasparex games.
      </p>
    </article>
  );
}

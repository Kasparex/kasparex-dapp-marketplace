'use client';

import type { TyconGameState, YieldStats } from '@/lib/game/engine';
import { KX_PROSE, KX_PROSE_PARAGRAPH } from '@/lib/ui/kxTypography';
import {
  GameOverviewTip,
  GameOverviewTitleBlock,
} from '@/components/games/panels/GameOverviewSections';

export function OverviewPanel({ tycon: _tycon, stats: _stats }: { tycon: TyconGameState; stats: YieldStats }) {
  return (
    <article className={KX_PROSE}>
      <GameOverviewTitleBlock
        as="h2"
        kicker="Rewards"
        title="How rewards work"
        subtitle="Idle NFT mining, Shop energy, and Hub refine points."
      />
      <p className={KX_PROSE_PARAGRAPH}>
        Diamond Veins is an idle miner on the Kaspa network. Assign Workers, Operators, or Foremen to NFT slots (first
        Worker free), keep energy topped up from the Shop, and refine Diamonds from the Game Deck into Hub redeem points.
      </p>

      <GameOverviewTip title="Session tip">
        Diamond and Rarest NFTs extend Session max (+15% / +25%). KREXPRIME and PIXELKREX add +5%. Active Shop boosts
        extend session length and multiply Diamond flow while their timers run.
      </GameOverviewTip>

      <GameOverviewTitleBlock
        as="h3"
        kicker="Step 1"
        title="Slot &amp; Mine"
        subtitle="Deploy an NFT, then let idle energy produce Diamonds."
      />
      <p className={KX_PROSE_PARAGRAPH}>
        Place a Kasparex NFT in a Worker, Operator, or Foreman slot. Higher tiers mine faster and last longer. Buy extra
        slots when you are ready to scale capacity.
      </p>

      <GameOverviewTitleBlock
        as="h3"
        kicker="Step 2"
        title="Feed &amp; Boost"
        subtitle="Restore energy anytime; boosts raise live flow."
      />
      <p className={KX_PROSE_PARAGRAPH}>
        When a worker is Exhausted, use Feed or Quick feed with Field Rations, Energy Drinks, or Repair Kits from the
        Shop. Yield and efficiency boosts multiply Diamonds while active.
      </p>

      <GameOverviewTitleBlock
        as="h3"
        kicker="Step 3"
        title="Refine on Hub"
        subtitle="Same Rewards bridge as Minecore."
      />
      <p className={KX_PROSE_PARAGRAPH}>
        Refine Diamonds from the Game Deck into Hub points, then spend them on the Rewards catalog when distribution is
        open.
      </p>
    </article>
  );
}

'use client';

/**
 * Structured overview copy aligned with live Minecore tabs (Mining, Build, Power, Crew, Shop, Redeem).
 * Chronicles Hub article typography: open prose, kickers, amber tip boxes.
 */
import { KX_PROSE, KX_PROSE_LIST, KX_PROSE_LIST_ITEM, KX_PROSE_PARAGRAPH } from '@/lib/ui/kxTypography';
import {
  GameOverviewTip,
  GameOverviewTitleBlock,
} from '@/components/games/panels/GameOverviewSections';

export function MinecoreArticle(props: {
  /** @deprecated Featured image lives on the Game header; ignored in Overview. */
  featuredImage?: string;
  gameName?: string;
  hint?: string;
}) {
  const name = props.gameName ?? 'Minecore';

  return (
    <div className="space-y-10">
      <article className={KX_PROSE}>
        <GameOverviewTitleBlock
          as="h2"
          kicker="Game guide"
          title={name}
          subtitle="Build plants, staff Crew NFTs, run timed extraction, then refine Diamonds into Hub rewards."
        />
        {props.hint?.trim() ? <p className={KX_PROSE_PARAGRAPH}>{props.hint.trim()}</p> : null}
        <p className={KX_PROSE_PARAGRAPH}>
          Minecore is the plant-based diamond mining complex beneath Kaspaland. You unlock plant slots with KAS, craft
          machines and power parts on Build, buy ingredients and boosts in Shop, assign Worker / Operator / Foreman NFTs
          on Crew, then run timed cycles on Mining. Finished runs credit Diamonds automatically; Redeem turns them into
          refinement points toward GRID or KREX.
        </p>

        <GameOverviewTip title="Start here">
          Connect a Kaspa wallet, buy ingredients in Shop, craft a machine on Build, unlock a plant on Mining, install
          machine + battery + crew, then press Start. Diamonds land in your Game Deck when the cycle or battery ends.
        </GameOverviewTip>

        <GameOverviewTitleBlock
          as="h3"
          kicker="Setting"
          title="The underground complex"
          subtitle="BlockDAG energy crystallizes into Diamonds inside layered veins."
        />
        <p className={KX_PROSE_PARAGRAPH}>
          Minecore sits under the neon spine of Kaspaland. Energy veins compress Kaspa BlockDAG activity into Diamonds.
          ARIA maps the upper sectors; deeper layers are less stable and more rewarding. Krex and Vector opened the
          complex so operators can run plants that tap those veins safely.
        </p>

        <GameOverviewTitleBlock
          as="h3"
          kicker="Systems"
          title="How a plant works"
          subtitle="Machine, power, crew, and modules must be installed before a run."
        />
        <p className={KX_PROSE_PARAGRAPH}>Each plant is assembled from:</p>
        <ul className={`list-disc pl-5 ${KX_PROSE_LIST}`}>
          <li className={KX_PROSE_LIST_ITEM}>Machine: extraction capability and base rolling-cap output</li>
          <li className={KX_PROSE_LIST_ITEM}>Batteries / power nodes: charge and stability for timed cycles</li>
          <li className={KX_PROSE_LIST_ITEM}>
            Crew links: Worker, Operator, or Foreman deck rows from the Crew tab (Foreman unlocks AUTO on that plant)
          </li>
          <li className={KX_PROSE_LIST_ITEM}>Modules and boosts: output, efficiency, and overclock options</li>
        </ul>
        <p className={KX_PROSE_PARAGRAPH}>
          Plant tiers (Standard through Dominion) raise daily diamond caps and crew capacity. Upgrade plants after you
          unlock them; expand more plant slots with KAS (KREX fee discounts apply).
        </p>

        <GameOverviewTip title="Crew tip">
          Deploy NFTs on the Crew tab first, then bind those deck rows into a plant&apos;s Crew seats on Mining. Premium
          and Partner NFTs add rolling-cap Diamonds; a linked Foreman is required for AUTO restart.
        </GameOverviewTip>

        <GameOverviewTitleBlock
          as="h3"
          kicker="Loop"
          title="Day-to-day operation"
          subtitle="Craft → install → mine → credit → refine → expand."
        />
        <ul className={`list-disc pl-5 ${KX_PROSE_LIST}`}>
          <li className={KX_PROSE_LIST_ITEM}>Shop: buy ingredients, stability patches, and overclock charges</li>
          <li className={KX_PROSE_LIST_ITEM}>Build: craft machines, batteries, power nodes, and modules</li>
          <li className={KX_PROSE_LIST_ITEM}>Power: top up plant charge with KAS or KREX when batteries run dry</li>
          <li className={KX_PROSE_LIST_ITEM}>Mining: start or pause runs; diamonds credit when a cycle completes</li>
          <li className={KX_PROSE_LIST_ITEM}>Redeem: refine Diamonds into points, then redeem toward GRID / KREX caps</li>
        </ul>

        <GameOverviewTitleBlock
          as="h3"
          kicker="Rewards"
          title="Diamonds and Hub bridge"
          subtitle="Same refinement bridge as Diamond Veins and other Kasparex games."
        />
        <p className={KX_PROSE_PARAGRAPH}>
          Diamonds are the shared in-game currency across Kasparex Games. In Minecore they bank to your profile balance
          when a plant finishes. Refine on Redeem for Hub points, then claim ecosystem rewards from Rewards &amp; Points
          when pools allow.
        </p>
      </article>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/40 sm:p-6">
        <GameOverviewTitleBlock
          as="h3"
          compact
          kicker="Operations"
          title="Game flow"
          subtitle="Core loop at a glance."
        />
        <ul className={`mt-4 list-disc pl-5 ${KX_PROSE_LIST}`}>
          <li className={KX_PROSE_LIST_ITEM}>Buy ingredients in Shop and craft parts on Build.</li>
          <li className={KX_PROSE_LIST_ITEM}>
            Unlock a plant with KAS, install machine, batteries, modules, and Crew NFT links.
          </li>
          <li className={KX_PROSE_LIST_ITEM}>
            Start a mining run; when the cycle or battery ends, Diamonds credit to your refineable balance.
          </li>
          <li className={KX_PROSE_LIST_ITEM}>Use Power / Shop to recharge; enable AUTO only with a Foreman linked.</li>
          <li className={KX_PROSE_LIST_ITEM}>Refine on Redeem, then expand plants and crew to grow capacity.</li>
        </ul>
      </section>
    </div>
  );
}

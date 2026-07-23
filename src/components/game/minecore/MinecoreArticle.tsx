'use client';

/**
 * Structured overview copy (synced with repo root Minecore.md).
 * Chronicles Hub article typography: open prose, minimal boxes.
 */
import { KX_PROSE, KX_PROSE_LIST, KX_PROSE_LIST_ITEM, KX_PROSE_PARAGRAPH } from '@/lib/ui/kxTypography';
import { GAME_OVERVIEW_H2, GAME_OVERVIEW_H3 } from '@/components/games/panels/GameOverviewSections';

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
        <h2 className={GAME_OVERVIEW_H2}>{name}</h2>
        {props.hint?.trim() ? <p className={KX_PROSE_PARAGRAPH}>{props.hint.trim()}</p> : null}
        <p className={KX_PROSE_PARAGRAPH}>
          Use the tabs to craft parts, run power plants, assign NFT crew on the Crew tab (Worker / Operator / Foreman
          roles), then refine and redeem.
        </p>

        <h3 className={GAME_OVERVIEW_H3}>Introduction</h3>
        <p className={KX_PROSE_PARAGRAPH}>
          Minecore is the central diamond mining system located deep beneath Kaspaland. It is a structured underground
          network of sectors and energy veins where Diamonds are formed from condensed BlockDAG energy and can be
          extracted, refined, and used across the Kasparex ecosystem.
        </p>
        <p className={KX_PROSE_PARAGRAPH}>
          The system was not built from scratch. It was discovered during early Kasparex development, when Krex detected
          abnormal energy patterns beneath the city while working on top of the Kaspa BlockDAG. Further analysis revealed
          a hidden underground structure that behaved like a fully operational extraction system embedded within the
          deeper layers of the network.
        </p>
        <p className={KX_PROSE_PARAGRAPH}>
          Players enter Minecore as operators, building and managing mining plants to extract Diamonds and expand deeper
          into the system.
        </p>

        <h3 className={GAME_OVERVIEW_H3}>The environment</h3>
        <p className={KX_PROSE_PARAGRAPH}>
          Minecore consists of layered underground zones connected by energy veins. These veins carry compressed network
          energy that naturally crystallizes into Diamonds.
        </p>
        <p className={KX_PROSE_PARAGRAPH}>
          The structure does not follow standard geological rules. Some sectors appear stable and predictable, while
          others behave dynamically, shifting output, stability, or response depending on how they are used. Deeper
          layers introduce higher yield, but also instability and unknown behaviors.
        </p>
        <p className={KX_PROSE_PARAGRAPH}>
          ARIA has mapped only the upper layers. Beyond that, the system becomes increasingly difficult to interpret.
        </p>

        <h3 className={GAME_OVERVIEW_H3}>Diamond formation</h3>
        <p className={KX_PROSE_PARAGRAPH}>
          Diamonds are not ordinary minerals. They are formed when BlockDAG energy flows compress and stabilize into
          physical form within the underground veins.
        </p>
        <p className={KX_PROSE_PARAGRAPH}>
          Each Diamond contains condensed fragments of network activity, making it both a resource and a unit of stored
          energy. This allows Diamonds to be refined and converted into usable output across the ecosystem.
        </p>

        <h3 className={GAME_OVERVIEW_H3}>Mining plants</h3>
        <p className={KX_PROSE_PARAGRAPH}>
          Mining plants are the core operational units inside Minecore. They act as controlled interfaces between the
          operator and the underground system.
        </p>
        <p className={KX_PROSE_PARAGRAPH}>Each plant is assembled from multiple components:</p>
        <ul className={`list-disc pl-5 ${KX_PROSE_LIST}`}>
          <li className={KX_PROSE_LIST_ITEM}>Machine: defines extraction capability and base output</li>
          <li className={KX_PROSE_LIST_ITEM}>Power system: supplies energy required for operation</li>
          <li className={KX_PROSE_LIST_ITEM}>
            NFT crew decks: Worker / Operator / Foreman roles (assign matching KREXPRIME or PIXELKREX NFTs on the Crew
            tab; each plant links deck rows for bonuses)
          </li>
          <li className={KX_PROSE_LIST_ITEM}>Modules: enhance stability, output, or introduce special effects</li>
          <li className={KX_PROSE_LIST_ITEM}>Boost layer: adds multipliers powered by KREX or supported by KAS</li>
          <li className={KX_PROSE_LIST_ITEM}>Ingredients: required to craft and maintain all components</li>
        </ul>
        <p className={KX_PROSE_PARAGRAPH}>
          Vector designed the first machines capable of interacting with the veins. His ongoing work continues to expand
          the available tools and upgrades.
        </p>
        <p className={KX_PROSE_PARAGRAPH}>
          A plant becomes active only when all required components are installed and powered.
        </p>

        <h3 className={GAME_OVERVIEW_H3}>Operation flow</h3>
        <p className={KX_PROSE_PARAGRAPH}>Craft | Build | Mine | Diamonds credit | Refine | Redeem (GRID / KREX) | Expand</p>
        <p className={KX_PROSE_PARAGRAPH}>
          Gather materials, craft components, build plants, run mining cycles. Finished runs add diamonds to your balance
          automatically; refine them into points on Redeem, redeem output into GRID or KREX (within caps), then reinvest.
        </p>

        <h3 className={GAME_OVERVIEW_H3}>Timers and production</h3>
        <p className={KX_PROSE_PARAGRAPH}>Each mining plant runs on timed extraction cycles.</p>
        <p className={KX_PROSE_PARAGRAPH}>During an active cycle:</p>
        <ul className={`list-disc pl-5 ${KX_PROSE_LIST}`}>
          <li className={KX_PROSE_LIST_ITEM}>A progress bar tracks completion</li>
          <li className={KX_PROSE_LIST_ITEM}>A timer displays remaining duration</li>
          <li className={KX_PROSE_LIST_ITEM}>Output is calculated dynamically</li>
        </ul>
        <p className={KX_PROSE_PARAGRAPH}>
          When the cycle ends or the battery is exhausted, mined diamonds credit to your refineable balance
          automatically; start the next run when you are ready.
        </p>

        <h3 className={GAME_OVERVIEW_H3}>Materials and crafting</h3>
        <p className={KX_PROSE_PARAGRAPH}>
          Minecore includes a fabrication layer where raw materials are transformed into usable components.
        </p>
        <p className={KX_PROSE_PARAGRAPH}>Materials include:</p>
        <ul className={`list-disc pl-5 ${KX_PROSE_LIST}`}>
          <li className={KX_PROSE_LIST_ITEM}>Crystal Dust</li>
          <li className={KX_PROSE_LIST_ITEM}>Alloy Plates</li>
          <li className={KX_PROSE_LIST_ITEM}>Circuit Mesh</li>
          <li className={KX_PROSE_LIST_ITEM}>Energy Cells</li>
          <li className={KX_PROSE_LIST_ITEM}>Core Shards</li>
          <li className={KX_PROSE_LIST_ITEM}>Cooling materials</li>
          <li className={KX_PROSE_LIST_ITEM}>Advanced components</li>
        </ul>
        <p className={KX_PROSE_PARAGRAPH}>These are used to craft machines, modules, power systems, and upgrades.</p>

        <h3 className={GAME_OVERVIEW_H3}>Power and fuel</h3>
        <p className={KX_PROSE_PARAGRAPH}>All mining operations require energy to function.</p>
        <ul className={`list-disc pl-5 ${KX_PROSE_LIST}`}>
          <li className={KX_PROSE_LIST_ITEM}>KAS acts as the primary fuel</li>
          <li className={KX_PROSE_LIST_ITEM}>Energy components support stability and efficiency</li>
        </ul>
        <p className={KX_PROSE_PARAGRAPH}>
          ARIA manages power distribution across accessible sectors, but not all zones can be fully stabilized.
        </p>
        <p className={KX_PROSE_PARAGRAPH}>Without sufficient power, mining cannot begin.</p>

        <h3 className={GAME_OVERVIEW_H3}>Boosts and multipliers</h3>
        <p className={KX_PROSE_PARAGRAPH}>KREX introduces a boost layer that enhances mining performance.</p>
        <p className={KX_PROSE_PARAGRAPH}>Boosts can:</p>
        <ul className={`list-disc pl-5 ${KX_PROSE_LIST}`}>
          <li className={KX_PROSE_LIST_ITEM}>Increase output</li>
          <li className={KX_PROSE_LIST_ITEM}>Reduce cycle time</li>
          <li className={KX_PROSE_LIST_ITEM}>Improve efficiency</li>
          <li className={KX_PROSE_LIST_ITEM}>Unlock advanced configurations</li>
        </ul>
        <p className={KX_PROSE_PARAGRAPH}>Combined with workers and modules, they create strong multiplier effects.</p>

        <h3 className={GAME_OVERVIEW_H3}>Refining and output</h3>
        <p className={KX_PROSE_PARAGRAPH}>
          Use the Redeem tab to convert diamonds into refinement points, then redeem points toward GRID or KREX within the
          published caps and pools.
        </p>

        <h3 className={GAME_OVERVIEW_H3}>External interference</h3>
        <p className={KX_PROSE_PARAGRAPH}>Certain sectors show signs of interference linked to the Null Gang.</p>
        <p className={KX_PROSE_PARAGRAPH}>These zones may contain:</p>
        <ul className={`list-disc pl-5 ${KX_PROSE_LIST}`}>
          <li className={KX_PROSE_LIST_ITEM}>Unstable outputs</li>
          <li className={KX_PROSE_LIST_ITEM}>Corrupted materials</li>
          <li className={KX_PROSE_LIST_ITEM}>Increased machine degradation</li>
        </ul>
        <p className={KX_PROSE_PARAGRAPH}>While risky, they often provide higher rewards.</p>

        <h3 className={GAME_OVERVIEW_H3}>The deeper layer</h3>
        <p className={KX_PROSE_PARAGRAPH}>
          Beyond mapped sectors, Minecore exhibits patterns that cannot be fully explained.
        </p>
        <p className={KX_PROSE_PARAGRAPH}>Operators have reported:</p>
        <ul className={`list-disc pl-5 ${KX_PROSE_LIST}`}>
          <li className={KX_PROSE_LIST_ITEM}>Unexpected efficiency spikes</li>
          <li className={KX_PROSE_LIST_ITEM}>Hidden sector access</li>
          <li className={KX_PROSE_LIST_ITEM}>Unexplained system responses</li>
        </ul>
        <p className={KX_PROSE_PARAGRAPH}>
          These behaviors are associated with a deeper system logic, often referred to as The Silent Protocol.
        </p>

        <h3 className={GAME_OVERVIEW_H3}>Expansion</h3>
        <p className={KX_PROSE_PARAGRAPH}>Minecore is designed as a scalable system.</p>
        <p className={KX_PROSE_PARAGRAPH}>Players expand by:</p>
        <ul className={`list-disc pl-5 ${KX_PROSE_LIST}`}>
          <li className={KX_PROSE_LIST_ITEM}>Unlocking new sectors</li>
          <li className={KX_PROSE_LIST_ITEM}>Building additional plants</li>
          <li className={KX_PROSE_LIST_ITEM}>Upgrading infrastructure</li>
          <li className={KX_PROSE_LIST_ITEM}>Optimizing configurations</li>
        </ul>
        <p className={KX_PROSE_PARAGRAPH}>As operations grow, the system reveals new behaviors and deeper layers.</p>

        <h3 className={GAME_OVERVIEW_H3}>System integration</h3>
        <p className={KX_PROSE_PARAGRAPH}>Diamonds mined in Minecore are used across other Kasparex Games.</p>
        <p className={KX_PROSE_PARAGRAPH}>They act as a universal in-game currency for:</p>
        <ul className={`list-disc pl-5 ${KX_PROSE_LIST}`}>
          <li className={KX_PROSE_LIST_ITEM}>Unlocking content</li>
          <li className={KX_PROSE_LIST_ITEM}>Entering game modes</li>
          <li className={KX_PROSE_LIST_ITEM}>Activating systems</li>
          <li className={KX_PROSE_LIST_ITEM}>Accessing rewards</li>
        </ul>
        <p className={KX_PROSE_PARAGRAPH}>Minecore serves as the production layer powering the entire ecosystem.</p>

        <h3 className={GAME_OVERVIEW_H3}>How the reward system works</h3>
        <p className={KX_PROSE_PARAGRAPH}>
          Minecore uses a multi-layered reward system designed for gas efficiency and cross-game synergy:
        </p>
        <p className={KX_PROSE_PARAGRAPH}>
          <strong className="text-zinc-900 dark:text-zinc-100">1. Mining credit.</strong> When a run completes, diamonds
          are banked to your profile balance (same flow you see in the game deck), ready to refine on the Redeem tab.
        </p>
        <p className={KX_PROSE_PARAGRAPH}>
          <strong className="text-zinc-900 dark:text-zinc-100">2. Refine.</strong> On Redeem, convert diamonds into
          refinement points at the configured rate (plus any in-game Worker / module bonuses).
        </p>
        <p className={KX_PROSE_PARAGRAPH}>
          <strong className="text-zinc-900 dark:text-zinc-100">3. Redeem tokens.</strong> Spend refinement points toward
          GRID or KREX subject to daily caps and pool display on that tab; L2 distribution follows the wider Kasparex
          rewards setup.
        </p>

        <h3 className={GAME_OVERVIEW_H3}>Summary</h3>
        <p className={KX_PROSE_PARAGRAPH}>
          Minecore is a system of building, managing, and optimizing mining operations within a discovered underground
          network powered by BlockDAG energy.
        </p>
        <p className={KX_PROSE_PARAGRAPH}>
          Operators construct infrastructure, run timed production cycles, and scale their systems to reach deeper and
          more powerful layers.
        </p>
        <p className={KX_PROSE_PARAGRAPH}>
          The deeper the operation goes, the greater the rewards, and the more complex the system becomes.
        </p>
      </article>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/40 sm:p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Game flow</h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Core loop at a glance.</p>
        <ul className={`mt-4 list-disc pl-5 ${KX_PROSE_LIST}`}>
          <li className={KX_PROSE_LIST_ITEM}>Craft parts and modules from ingredients.</li>
          <li className={KX_PROSE_LIST_ITEM}>
            Activate a plant slot with KAS and install machine, power, workers, and modules.
          </li>
          <li className={KX_PROSE_LIST_ITEM}>
            Start a run; when the cycle or battery ends, diamonds credit automatically to your refineable balance.
          </li>
          <li className={KX_PROSE_LIST_ITEM}>Refine diamonds into points, then redeem output into GRID (V1 rules).</li>
          <li className={KX_PROSE_LIST_ITEM}>Expand slots and upgrade parts to grow your mining complex.</li>
        </ul>
      </section>
    </div>
  );
}

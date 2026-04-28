'use client';

/**
 * Structured overview copy (synced with repo root Minecore.md).
 * One GamePanelCard per section — matches Overview “Game flow” styling.
 */
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';

export function MinecoreArticle(props: { featuredImage?: string; gameName?: string; hint?: string }) {
  const name = props.gameName ?? 'Minecore';
  const body = 'space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400';
  const ulFlow = 'list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400';

  return (
    <div className="space-y-6">
      {props.featuredImage ? (
        <GamePanelCard title={name} hint={props.hint}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={props.featuredImage} alt={name} className="aspect-video w-full object-cover" />
            </div>
            <div className={`flex flex-col justify-center ${body}`}>
              {props.hint ? <p className="font-medium text-zinc-700 dark:text-zinc-300">{props.hint}</p> : null}
              <p>Use the tabs to craft parts, run power plants, assign NFT crew on Workers (Worker / Operator / Foreman), then refine and redeem.</p>
            </div>
          </div>
        </GamePanelCard>
      ) : null}

      <GamePanelCard title="Introduction">
        <div className={body}>
          <p>
            Minecore is the central diamond mining system located deep beneath Kaspaland. It is a structured underground network of sectors and energy veins where Diamonds are formed from condensed BlockDAG
            energy and can be extracted, refined, and used across the Kasparex ecosystem.
          </p>
          <p>
            The system was not built from scratch. It was discovered during early Kasparex development, when Krex detected abnormal energy patterns beneath the city while working on top of the Kaspa BlockDAG.
            Further analysis revealed a hidden underground structure that behaved like a fully operational extraction system embedded within the deeper layers of the network.
          </p>
          <p>Players enter Minecore as operators, building and managing mining plants to extract Diamonds and expand deeper into the system.</p>
        </div>
      </GamePanelCard>

      <GamePanelCard title="The environment">
        <div className={body}>
          <p>Minecore consists of layered underground zones connected by energy veins. These veins carry compressed network energy that naturally crystallizes into Diamonds.</p>
          <p>
            The structure does not follow standard geological rules. Some sectors appear stable and predictable, while others behave dynamically, shifting output, stability, or response depending on how they are
            used. Deeper layers introduce higher yield, but also instability and unknown behaviors.
          </p>
          <p>ARIA has mapped only the upper layers. Beyond that, the system becomes increasingly difficult to interpret.</p>
        </div>
      </GamePanelCard>

      <GamePanelCard title="Diamond formation">
        <div className={body}>
          <p>Diamonds are not ordinary minerals. They are formed when BlockDAG energy flows compress and stabilize into physical form within the underground veins.</p>
          <p>
            Each Diamond contains condensed fragments of network activity, making it both a resource and a unit of stored energy. This allows Diamonds to be refined and converted into usable output across the
            ecosystem.
          </p>
        </div>
      </GamePanelCard>

      <GamePanelCard title="Mining plants">
        <div className={body}>
          <p>Mining plants are the core operational units inside Minecore. They act as controlled interfaces between the operator and the underground system.</p>
          <p>Each plant is assembled from multiple components:</p>
          <ul className={ulFlow}>
            <li>Machine: defines extraction capability and base output</li>
            <li>Power system: supplies energy required for operation</li>
            <li>NFT crew decks: Worker / Operator / Foreman roles (assign matching KREXPRIME or PIXELKREX NFTs on the Workers tab; each plant picks a Worker deck slot for bonuses)</li>
            <li>Modules: enhance stability, output, or introduce special effects</li>
            <li>Boost layer: adds multipliers powered by KREX or supported by KAS</li>
            <li>Ingredients: required to craft and maintain all components</li>
          </ul>
          <p>Vector designed the first machines capable of interacting with the veins. His ongoing work continues to expand the available tools and upgrades.</p>
          <p>A plant becomes active only when all required components are installed and powered.</p>
        </div>
      </GamePanelCard>

      <GamePanelCard title="Operation flow">
        <div className={body}>
          <p>Craft | Build | Mine | Diamonds credit | Refine | Redeem (GRID / KREX) | Expand</p>
          <p>
            Gather materials, craft components, build plants, run mining cycles. Finished runs add diamonds to your balance automatically; refine them into points on Redeem, redeem output into GRID or KREX (within
            caps), then reinvest.
          </p>
        </div>
      </GamePanelCard>

      <GamePanelCard title="Timers and production">
        <div className={body}>
          <p>Each mining plant runs on timed extraction cycles.</p>
          <p>During an active cycle:</p>
          <ul className={ulFlow}>
            <li>A progress bar tracks completion</li>
            <li>A timer displays remaining duration</li>
            <li>Output is calculated dynamically</li>
          </ul>
          <p>When the cycle ends or the battery is exhausted, mined diamonds credit to your refineable balance automatically; start the next run when you are ready.</p>
        </div>
      </GamePanelCard>

      <GamePanelCard title="Materials and crafting">
        <div className={body}>
          <p>Minecore includes a fabrication layer where raw materials are transformed into usable components.</p>
          <p>Materials include:</p>
          <ul className={ulFlow}>
            <li>Crystal Dust</li>
            <li>Alloy Plates</li>
            <li>Circuit Mesh</li>
            <li>Energy Cells</li>
            <li>Core Shards</li>
            <li>Cooling materials</li>
            <li>Advanced components</li>
          </ul>
          <p>These are used to craft machines, modules, power systems, and upgrades.</p>
        </div>
      </GamePanelCard>

      <GamePanelCard title="Power and fuel">
        <div className={body}>
          <p>All mining operations require energy to function.</p>
          <ul className={ulFlow}>
            <li>KAS acts as the primary fuel</li>
            <li>Energy components support stability and efficiency</li>
          </ul>
          <p>ARIA manages power distribution across accessible sectors, but not all zones can be fully stabilized.</p>
          <p>Without sufficient power, mining cannot begin.</p>
        </div>
      </GamePanelCard>

      <GamePanelCard title="Boosts and multipliers">
        <div className={body}>
          <p>KREX introduces a boost layer that enhances mining performance.</p>
          <p>Boosts can:</p>
          <ul className={ulFlow}>
            <li>Increase output</li>
            <li>Reduce cycle time</li>
            <li>Improve efficiency</li>
            <li>Unlock advanced configurations</li>
          </ul>
          <p>Combined with workers and modules, they create strong multiplier effects.</p>
        </div>
      </GamePanelCard>

      <GamePanelCard title="Refining and output">
        <div className={body}>
          <p>Use the Redeem tab to convert diamonds into refinement points, then redeem points toward GRID or KREX within the published caps and pools.</p>
        </div>
      </GamePanelCard>

      <GamePanelCard title="External interference">
        <div className={body}>
          <p>Certain sectors show signs of interference linked to the Null Gang.</p>
          <p>These zones may contain:</p>
          <ul className={ulFlow}>
            <li>Unstable outputs</li>
            <li>Corrupted materials</li>
            <li>Increased machine degradation</li>
          </ul>
          <p>While risky, they often provide higher rewards.</p>
        </div>
      </GamePanelCard>

      <GamePanelCard title="The deeper layer">
        <div className={body}>
          <p>Beyond mapped sectors, Minecore exhibits patterns that cannot be fully explained.</p>
          <p>Operators have reported:</p>
          <ul className={ulFlow}>
            <li>Unexpected efficiency spikes</li>
            <li>Hidden sector access</li>
            <li>Unexplained system responses</li>
          </ul>
          <p>These behaviors are associated with a deeper system logic, often referred to as The Silent Protocol.</p>
        </div>
      </GamePanelCard>

      <GamePanelCard title="Expansion">
        <div className={body}>
          <p>Minecore is designed as a scalable system.</p>
          <p>Players expand by:</p>
          <ul className={ulFlow}>
            <li>Unlocking new sectors</li>
            <li>Building additional plants</li>
            <li>Upgrading infrastructure</li>
            <li>Optimizing configurations</li>
          </ul>
          <p>As operations grow, the system reveals new behaviors and deeper layers.</p>
        </div>
      </GamePanelCard>

      <GamePanelCard title="System integration">
        <div className={body}>
          <p>Diamonds mined in Minecore are used across other Kasparex Games.</p>
          <p>They act as a universal in-game currency for:</p>
          <ul className={ulFlow}>
            <li>Unlocking content</li>
            <li>Entering game modes</li>
            <li>Activating systems</li>
            <li>Accessing rewards</li>
          </ul>
          <p>Minecore serves as the production layer powering the entire ecosystem.</p>
        </div>
      </GamePanelCard>

      <GamePanelCard title="How the reward system works">
        <div className={body}>
          <p>Minecore uses a multi-layered reward system designed for gas efficiency and cross-game synergy:</p>
          <ul className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              <strong className="block text-zinc-900 dark:text-zinc-100">1. Mining credit</strong>
              When a run completes, diamonds are banked to your profile balance (same flow you see in the game deck)—ready to refine on the Redeem tab.
            </li>
            <li>
              <strong className="block text-zinc-900 dark:text-zinc-100">2. Refine</strong>
              On Redeem, convert diamonds into refinement points at the configured rate (plus any in-game Worker / module bonuses).
            </li>
            <li>
              <strong className="block text-zinc-900 dark:text-zinc-100">3. Redeem tokens</strong>
              Spend refinement points toward GRID or KREX subject to daily caps and pool display on that tab; L2 distribution follows the wider Kasparex rewards setup.
            </li>
          </ul>
        </div>
      </GamePanelCard>

      <GamePanelCard title="Summary">
        <div className={body}>
          <p>Minecore is a system of building, managing, and optimizing mining operations within a discovered underground network powered by BlockDAG energy.</p>
          <p>Operators construct infrastructure, run timed production cycles, and scale their systems to reach deeper and more powerful layers.</p>
          <p>The deeper the operation goes, the greater the rewards, and the more complex the system becomes.</p>
        </div>
      </GamePanelCard>
    </div>
  );
}

'use client';

/**
 * Structured overview copy (synced with repo root Minecore.md).
 * Rendered as semantic sections instead of a single lore string.
 */
export function MinecoreArticle(props: { featuredImage?: string; gameName?: string; hint?: string }) {
  const name = props.gameName ?? 'Minecore';
  return (
    <article className="prose prose-zinc max-w-none dark:prose-invert prose-headings:tracking-tight prose-h2:mt-10 prose-h2:mb-3 prose-h2:text-lg prose-h2:font-bold prose-h3:mt-0 prose-h3:mb-2 prose-h3:text-sm prose-h3:font-semibold prose-h3:uppercase prose-h3:tracking-wide prose-h3:text-zinc-500 dark:prose-h3:text-zinc-400 prose-p:my-3 prose-p:leading-relaxed prose-hr:my-8 prose-hr:border-zinc-200 dark:prose-hr:border-zinc-800 prose-li:my-1">
      {props.featuredImage ? (
        <div className="not-prose mb-8 grid gap-5 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={props.featuredImage} alt={name} className="aspect-video w-full object-cover" />
          </div>
          <div className="flex flex-col justify-center space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {props.hint ? <p className="text-zinc-700 dark:text-zinc-300">{props.hint}</p> : null}
            <p>Use the tabs to craft parts, run power plants, assign NFT workers, and redeem refinement output.</p>
          </div>
        </div>
      ) : null}

      <h2>Introduction</h2>
      <p>
        Minecore is the central diamond mining system located deep beneath Kaspaland. It is a structured underground network of sectors and energy veins where Diamonds are formed from condensed BlockDAG energy
        and can be extracted, refined, and used across the Kasparex ecosystem.
      </p>
      <p>
        The system was not built from scratch. It was discovered during early Kasparex development, when Krex detected abnormal energy patterns beneath the city while working on top of the Kaspa BlockDAG.
        Further analysis revealed a hidden underground structure that behaved like a fully operational extraction system embedded within the deeper layers of the network.
      </p>
      <p>Players enter Minecore as operators, building and managing mining plants to extract Diamonds and expand deeper into the system.</p>

      <hr />

      <h2>The environment</h2>
      <p>
        Minecore consists of layered underground zones connected by energy veins. These veins carry compressed network energy that naturally crystallizes into Diamonds.
      </p>
      <p>
        The structure does not follow standard geological rules. Some sectors appear stable and predictable, while others behave dynamically, shifting output, stability, or response depending on how they
        are used. Deeper layers introduce higher yield, but also instability and unknown behaviors.
      </p>
      <p>ARIA has mapped only the upper layers. Beyond that, the system becomes increasingly difficult to interpret.</p>

      <hr />

      <h2>Diamond formation</h2>
      <p>Diamonds are not ordinary minerals. They are formed when BlockDAG energy flows compress and stabilize into physical form within the underground veins.</p>
      <p>
        Each Diamond contains condensed fragments of network activity, making it both a resource and a unit of stored energy. This allows Diamonds to be refined and converted into usable output across the
        ecosystem.
      </p>

      <hr />

      <h2>Mining plants</h2>
      <p>Mining plants are the core operational units inside Minecore. They act as controlled interfaces between the operator and the underground system.</p>
      <p>Each plant is assembled from multiple components:</p>
      <ul className="list-none pl-0">
        <li>
          Machine: defines extraction capability and base output
        </li>
        <li>
          Power system: supplies energy required for operation
        </li>
        <li>
          Worker slot: NFT workers increase efficiency and performance
        </li>
        <li>
          Modules: enhance stability, output, or introduce special effects
        </li>
        <li>
          Boost layer: adds multipliers powered by KREX or supported by KAS
        </li>
        <li>
          Ingredients: required to craft and maintain all components
        </li>
      </ul>
      <p>Vector designed the first machines capable of interacting with the veins. His ongoing work continues to expand the available tools and upgrades.</p>
      <p>A plant becomes active only when all required components are installed and powered.</p>

      <hr />

      <h2>Operation flow</h2>
      <p>
        Craft | Build | Mine | Extract Diamonds | Refine | Redeem for GRID | Expand
      </p>
      <p>
        Operators gather materials, craft components, build plants, run mining cycles, extract Diamonds, refine them into usable output, convert that output into GRID, and reinvest into stronger
        infrastructure.
      </p>

      <hr />

      <h2>Timers and production</h2>
      <p>Each mining plant runs on timed extraction cycles.</p>
      <p>During an active cycle:</p>
      <ul className="list-none pl-0">
        <li>A progress bar tracks completion</li>
        <li>A timer displays remaining duration</li>
        <li>Output is calculated dynamically</li>
      </ul>
      <p>When the cycle completes, Diamonds become available for extraction. The plant can then be restarted, upgraded, or reconfigured.</p>

      <hr />

      <h2>Materials and crafting</h2>
      <p>Minecore includes a fabrication layer where raw materials are transformed into usable components.</p>
      <p>Materials include:</p>
      <ul className="list-none pl-0">
        <li>Crystal Dust</li>
        <li>Alloy Plates</li>
        <li>Circuit Mesh</li>
        <li>Energy Cells</li>
        <li>Core Shards</li>
        <li>Cooling materials</li>
        <li>Advanced components</li>
      </ul>
      <p>These are used to craft machines, modules, power systems, and upgrades.</p>

      <hr />

      <h2>Power and fuel</h2>
      <p>All mining operations require energy to function.</p>
      <ul className="list-none pl-0">
        <li>
          KAS acts as the primary fuel
        </li>
        <li>
          Energy components support stability and efficiency
        </li>
      </ul>
      <p>ARIA manages power distribution across accessible sectors, but not all zones can be fully stabilized.</p>
      <p>Without sufficient power, mining cannot begin.</p>

      <hr />

      <h2>Boosts and multipliers</h2>
      <p>KREX introduces a boost layer that enhances mining performance.</p>
      <p>Boosts can:</p>
      <ul className="list-none pl-0">
        <li>Increase output</li>
        <li>Reduce cycle time</li>
        <li>Improve efficiency</li>
        <li>Unlock advanced configurations</li>
      </ul>
      <p>Combined with workers and modules, they create strong multiplier effects.</p>

      <hr />

      <h2>Refining and output</h2>
      <p>Extracted Diamonds can be refined into higher-value output.</p>
      <p>Refinement allows operators to convert raw production into structured rewards, which can then be redeemed for GRID.</p>
      <p>This connects Minecore directly to the broader Kasparex reward system.</p>

      <hr />

      <h2>External interference</h2>
      <p>Certain sectors show signs of interference linked to the Null Gang.</p>
      <p>These zones may contain:</p>
      <ul className="list-none pl-0">
        <li>Unstable outputs</li>
        <li>Corrupted materials</li>
        <li>Increased machine degradation</li>
      </ul>
      <p>While risky, they often provide higher rewards.</p>

      <hr />

      <h2>The deeper layer</h2>
      <p>Beyond mapped sectors, Minecore exhibits patterns that cannot be fully explained.</p>
      <p>Operators have reported:</p>
      <ul className="list-none pl-0">
        <li>Unexpected efficiency spikes</li>
        <li>Hidden sector access</li>
        <li>Unexplained system responses</li>
      </ul>
      <p>
        These behaviors are associated with a deeper system logic, often referred to as The Silent Protocol.
      </p>

      <hr />

      <h2>Expansion</h2>
      <p>Minecore is designed as a scalable system.</p>
      <p>Players expand by:</p>
      <ul className="list-none pl-0">
        <li>Unlocking new sectors</li>
        <li>Building additional plants</li>
        <li>Upgrading infrastructure</li>
        <li>Optimizing configurations</li>
      </ul>
      <p>As operations grow, the system reveals new behaviors and deeper layers.</p>

      <hr />

      <h2>System integration</h2>
      <p>Diamonds mined in Minecore are used across other Kasparex Games.</p>
      <p>They act as a universal in-game currency for:</p>
      <ul className="list-none pl-0">
        <li>Unlocking content</li>
        <li>Entering game modes</li>
        <li>Activating systems</li>
        <li>Accessing rewards</li>
      </ul>
      <p>Minecore serves as the production layer powering the entire ecosystem.</p>

      <hr />

      <h2>Summary</h2>
      <p>
        Minecore is a system of building, managing, and optimizing mining operations within a discovered underground network powered by BlockDAG energy.
      </p>
      <p>
        Operators construct infrastructure, run timed production cycles, and scale their systems to reach deeper and more powerful layers.
      </p>
      <p>The deeper the operation goes, the greater the rewards, and the more complex the system becomes.</p>
    </article>
  );
}

'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getGameBySlugFromRegistry } from '@/lib/games/registry';

const KaspaL1WalletButton = dynamic(
  () => import('@/components/KaspaL1WalletButton').then((mod) => ({ default: mod.KaspaL1WalletButton })),
  { ssr: false }
);

const MinecoreDashboard = dynamic(
  () => import('@/components/game/minecore/MinecoreDashboard').then((m) => ({ default: m.MinecoreDashboard })),
  { ssr: false, loading: () => <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">Loading Minecore…</div> }
);

const LORE_STORY = `MINCORE - The Diamond Mining Complex of Kaspaland.

Introduction

Minecore is the central diamond mining system located deep beneath Kaspaland. It is a structured underground network of sectors and energy veins where Diamonds are formed from condensed BlockDAG energy and can be extracted, refined, and used across the Kasparex ecosystem.

The system was not built from scratch. It was discovered during early Kasparex development, when Krex detected abnormal energy patterns beneath the city while working on top of the Kaspa BlockDAG. Further analysis revealed a hidden underground structure that behaved like a fully operational extraction system, already embedded within the deeper layers of the network.

Players enter Minecore as operators, building and managing mining plants to extract Diamonds and expand deeper into the system.

The environment

Minecore consists of layered underground zones connected by energy veins. These veins carry compressed network energy that naturally crystallizes into Diamonds.

The structure does not follow standard geological rules. Some sectors appear stable and predictable, while others behave dynamically, shifting output, stability, or response depending on how they are used. Deeper layers introduce higher yield but also instability, unusual reactions, and unknown behaviors.

ARIA has mapped only the upper layers. Beyond that, the system becomes increasingly difficult to interpret.

Diamond formation

Diamonds are not ordinary minerals. They are formed when BlockDAG energy flows compress and stabilize into physical form within the underground veins.

Each Diamond contains condensed fragments of network activity, making it both a resource and a unit of stored energy. This is what allows Diamonds to be refined and converted into usable output across the ecosystem.

Extraction is possible, but the process requires precise control. Without proper systems in place, the energy within the veins becomes unstable.

Mining plants

Mining plants are the core operational units inside Minecore. They act as controlled interfaces between the operator and the underground system.

Each plant is assembled from multiple components that define its behavior. Machines determine extraction capability and base output. Power systems supply the energy required for operation. Worker slots allow NFT operators to increase efficiency. Modules enhance stability, output, or introduce special effects. Boost layers provide additional multipliers powered by KREX or supported by KAS. Ingredients are required to craft and maintain all of these elements.

Vector was responsible for designing the first machines capable of safely interacting with the veins. His ongoing work in the Garage continues to expand the range of tools and upgrades available to operators.

A plant becomes active only when all required components are installed and powered. Once activated, it begins extracting Diamonds directly from the underlying vein.

Operation flow

Minecore operates on a continuous production cycle. Operators gather materials, craft components, build and configure mining plants, run mining cycles, extract Diamonds, refine them into usable output, convert that output into GRID, and reinvest into stronger infrastructure.

This loop defines progression. Each cycle increases efficiency, unlocks new possibilities, and enables access to deeper layers of the system.

Timers and production

Each mining plant runs on timed extraction cycles. During an active cycle, a progress bar tracks completion and a timer displays the remaining duration. Output is calculated based on the configuration of the plant and the conditions of the sector.

When the cycle completes, Diamonds become available for extraction. The plant can then be restarted, upgraded, or reconfigured for improved performance.

Higher-tier operations produce more output but often require longer cycles and more precise setups.

Materials and crafting

Minecore includes a fabrication layer where raw materials are transformed into usable components. Materials such as Crystal Dust, Alloy Plates, Circuit Mesh, Energy Cells, and Core Shards are used to construct machines, modules, and power systems.

These materials are obtained through mining, processing, and exploration of different sectors. More advanced components unlock stronger machines and allow operators to access deeper and more complex zones.

Power and fuel

All mining operations require energy to function. KAS acts as the primary fuel, while crafted energy components support efficiency and stability.

ARIA manages power distribution across accessible sectors, but not all zones can be fully stabilized. Some areas require advanced configurations to maintain continuous operation.

Without sufficient power, mining cannot begin. Unstable power setups can reduce output or interrupt extraction cycles.

Boosts and multipliers

KREX introduces a boost layer that enhances mining performance. It can be used to increase output, reduce cycle time, improve efficiency, and unlock advanced configurations.

When combined with workers and modules, these boosts create strong multiplier effects that significantly impact production.

Refining and output

Extracted Diamonds can be refined into higher-value output. Refinement allows operators to convert raw production into structured rewards, which can then be redeemed for GRID.

This process connects Minecore directly to the broader reward system of the Kasparex ecosystem and enables cross-game functionality.

External interference

Minecore is not isolated. Certain sectors show signs of external interference linked to the Null Gang. These areas behave differently, producing unstable outputs and corrupted materials.

While these zones can offer higher rewards, they introduce additional risk. Machines may degrade faster, and extracted resources may require additional processing.

Some operators intentionally enter these zones to maximize returns.

The deeper layer

Beyond mapped sectors, Minecore exhibits patterns that cannot be fully explained. Operators have reported unexpected efficiency spikes, hidden sector access, and system responses that are not triggered by any visible condition.

These behaviors have been informally described as part of a deeper underlying logic within Minecore, sometimes referred to as the Silent Protocol.

It is not documented, but it influences the system.

Expansion

Minecore is designed as a scalable system. Operators expand by unlocking new sectors, building additional plants, upgrading infrastructure, and optimizing configurations.

As operations grow, the system reveals new behaviors, new materials, and new challenges. Each expansion pushes deeper into layers that are less stable but more valuable.

System integration

Diamonds mined in Minecore are used across other Kasparex Games. They function as a universal in-game currency for unlocking content, accessing systems, and participating in different game modules.

Minecore serves as the production layer that powers the entire ecosystem.

Summary

Minecore is a system of building, managing, and optimizing mining operations within a discovered underground network powered by BlockDAG energy.

Operators construct their infrastructure, run timed production cycles, and scale their systems to reach deeper and more powerful layers. As efficiency increases, so does output and access to advanced parts of the system.

The deeper the operation goes, the more valuable the rewards become, and the more complex the system reveals itself to be.`;

function MinecoreContent() {
  const { state } = useKaspaWallet();
  const game = getGameBySlugFromRegistry('minecore');

  if (!game) return <div className="p-8 text-zinc-600 dark:text-zinc-400">Game not found</div>;

  const featuredImage = game.featuredImage ?? '';

  return (
    <div className="flex min-h-screen flex-col overflow-hidden relative bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 h-[50%] w-[50%] bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.12),transparent_70%)] blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[50%] w-[50%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,92,246,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,92,246,0.1),transparent_70%)] blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.04]" />
      </div>

      <Header />

      <main className="relative z-10 flex-1 p-4 lg:p-8">
        <div className="mx-auto flex h-full max-w-7xl flex-col">
          <div className="mb-6">
            <Link
              href="/games"
              className="group inline-flex items-center gap-2 text-base font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              <svg className="h-5 w-5 transform transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Games
            </Link>
          </div>

          <div className="flex-1">
            {!state.isConnected ? (
              <div className="flex h-[60vh] flex-col items-center justify-center space-y-6 text-center">
                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6">
                  <svg className="h-16 w-16 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l7 7-7 13L5 9l7-7z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 lg:text-4xl">Minecore</h1>
                <p className="mx-auto max-w-md text-base text-zinc-600 dark:text-zinc-400">
                  Wallet connection required to unlock plant slots and run mining cycles.
                </p>
                <div className="[&_button]:h-14 [&_button]:px-8 [&_button]:text-base">
                  <KaspaL1WalletButton />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <MinecoreDashboard featuredImage={featuredImage} loreStory={LORE_STORY} gameDescription={game.description} game={game} gameName={game.name} />
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function MinecorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white text-base text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">Loading…</div>}>
      <MinecoreContent />
    </Suspense>
  );
}


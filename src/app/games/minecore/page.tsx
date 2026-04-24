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

const LORE_STORY = `# MINECORE
## The Diamond Engine Beneath Kaspaland

---

## INTRODUCTION

Beneath the neon skyline of Kaspaland, far below the streets, towers, and data flows, lies a system that should not exist.

Not a mine.
Not a factory.
Not something that was ever built.

It is called Minecore.

---

## THE DISCOVERY

Krex did not set out to find it.

While building Kasparex on top of the Kaspa BlockDAG, he began detecting irregular signals deep below the city. Not transactions. Not network noise. Something else.

Structured.
Repeating.
Alive.

Vector traced the anomaly to a series of underground layers that did not match any known geological or artificial structure. ARIA could not fully map it. Parts of it simply refused to resolve.

What they found was not infrastructure.

It was a system.

---

## THE DIAMONDS

At the core of Minecore are Diamonds.

They are not ordinary crystals. They are formed from compressed BlockDAG energy, where flows of data, time, and computation converge and condense into physical form.

Each Diamond is:
- a fragment of network energy
- a unit of compressed computation
- a stable piece of something that should remain abstract

They pulse.
They react.
They behave differently depending on how they are handled.

And they can be extracted.

---

## THE SYSTEM

Minecore is not controlled. It is interfaced.

Krex did not build it. He unlocked access to it.

Vector designed the first machines capable of operating within its environment. ARIA established partial control over its outer layers, stabilizing enough of the system to allow safe interaction.

But the deeper layers remain unknown.

Unmapped.
Unpredictable.

---

## YOUR ROLE

You are an operator inside Minecore.

You do not simply mine. You build.

You create mining plants using:
- extraction machines
- power systems fueled by KAS
- NFT workers that enhance performance
- modules that stabilize or boost output
- KREX-powered upgrades and multipliers

Once a plant is fully assembled and powered, it activates and begins extracting Diamonds.

This is not passive.

Every system requires setup, maintenance, and optimization.

---

## THE CORE LOOP

Minecore runs on a continuous operational cycle:

Craft → Build → Mine → Extract Diamonds → Refine → Redeem for GRID → Repeat and expand

You gather materials.
You fabricate components.
You build plants.
You extract Diamonds.
You refine them into usable output.
You convert that output into GRID.

Then you go deeper.

---

## THE DEEPER LAYERS

Not all sectors of Minecore behave the same.

Surface layers are stable and predictable.

Deeper layers introduce:
- higher output but faster machine degradation
- unstable power behavior
- altered material properties
- rare and hidden extraction zones

Some sectors respond differently depending on how you build your plant.

Some require specific configurations to unlock their full potential.

---

## MACHINES AND INFRASTRUCTURE

Mining inside Minecore depends on your setup.

Machines define your output:
- Pulse Drills
- Crystal Extractors
- Deep Vein Rigs
- Quantum Fracturers

Power systems sustain operations:
- Energy Cells
- Battery Packs
- Capacitors

Modules enhance performance:
- Cooling Systems
- Stability Modules
- ARIA Sensors
- Experimental components

Workers amplify efficiency and control.

Every decision affects production.

---

## ARIA AND VECTOR

ARIA monitors Minecore and stabilizes accessible sectors. It manages power flow, enforces system limits, and keeps operations functional.

Vector operates beyond those limits.

Inside Vector’s Garage, new machines, modules, and upgrades are developed. Some improve efficiency. Others push the system into unstable territory.

Not all of them are safe.

---

## THE NULL THREAT

Minecore is not uncontested.

The Null Gang has infiltrated parts of the system.

They do not extract Diamonds. They corrupt them.

Corrupted zones introduce:
- unstable outputs
- damaged machines
- altered resources

These areas offer higher rewards but come with higher risk.

Operators must decide whether to remain stable or push into corrupted sectors.

---

## THE SILENT PROTOCOL

There is something deeper inside Minecore.

Hidden behaviors that no one programmed.

No interface explains them.
No system acknowledges them.

Yet they exist.

Operators have triggered:
- unexpected boosts
- hidden access points
- unexplained efficiency spikes

These effects are not random.

They follow patterns.

This phenomenon is known as the Silent Protocol.

---

## EXPANSION

Minecore is only partially understood.

Each operator expands the system by:
- building new plants
- activating new sectors
- discovering new materials
- triggering new system behaviors

The more it is used, the more it reveals.

Or adapts.

---

## FINAL NOTE

Minecore is not just a mining system.

Diamonds are not just resources.

They are keys.

Every plant you build, every Diamond you extract, and every system you activate pushes deeper into something far larger than mining.

Something that was never meant to be fully accessed.

---

## ENTER MINECORE

Build your plants.
Power your systems.
Deploy your operators.

Extract. Refine. Expand.

Minecore is active.

Now it is yours to operate.`;

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


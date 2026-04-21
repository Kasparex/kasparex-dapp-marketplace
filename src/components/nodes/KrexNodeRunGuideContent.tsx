import Link from 'next/link';
import { NodeTypesInfoCards } from '@/components/nodes/NodeTypesInfoCards';
import nodeRewardTiers from '@/config/node-reward-tiers.json';

const rm = nodeRewardTiers.roleMultipliers as Record<string, number>;
const fr = nodeRewardTiers.feeReductionPercent as Record<string, number>;

/**
 * Shared “Run a KREX Node” documentation content.
 *
 * Used by `/nodes` (Setup tab) and legacy `/api/krex-node`.
 */
export function KrexNodeRunGuideContent() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Hero - Donations style (cyan gradient) */}
      <div className="relative mb-12 py-12 px-6 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-cyan-50/50 to-zinc-100 dark:from-zinc-950 dark:via-cyan-950/40 dark:to-zinc-950 border border-zinc-200 dark:border-transparent">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#06b6d4,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#0891b2,transparent_50%)]" />
        </div>
        <div className="relative z-10 w-full text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            Run a node
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white mb-6 leading-tight">
            Run a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-500 dark:from-cyan-400 dark:to-cyan-300">
              KREX Node
            </span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Kasparex is a community-powered layer that keeps the dApp Marketplace online, fast, and censorship-resistant.
          </p>
        </div>
      </div>

      {/* Key Message */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 mb-12">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Kasparex works even if nobody runs a node</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Core HTML and APIs are always served by Kasparex. KREX Nodes are optional helpers that reduce hosting costs,
          increase decentralization, and earn rewards for their operators.
        </p>
      </div>

      {/* What is a KREX Node */}
      <section id="what-is-krex-node" className="mb-12">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">What is a KREX Node?</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          A KREX Node is a lightweight helper node that you run on your own computer or server. It is <strong>not</strong>{' '}
          a Kaspa BlockDAG node and does not require heavy hardware.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                />
              </svg>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Pin & Mirror</h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Downloads dApp metadata from Kasparex and pins files via IPFS / Storacha
            </p>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Censorship-Resistant</h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Keeps dApps available even if central servers are down, strengthening the ecosystem
            </p>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Lightweight</h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Uses minimal resources (128-256 MB RAM, low CPU) - runs on any machine or Raspberry Pi
            </p>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Earn Rewards</h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Earn GRID rewards and benefit from KREX multipliers</p>
          </div>
        </div>
      </section>

      {/* Node Types */}
      <section id="node-types" className="mb-12">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Node Types</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Light Node</h3>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-cyan-600 dark:text-cyan-400 mt-1">•</span>
                <span>Pins IPFS / Storacha CIDs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-600 dark:text-cyan-400 mt-1">•</span>
                <span>Caches dApp metadata locally</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-600 dark:text-cyan-400 mt-1">•</span>
                <span>Periodically syncs with Kasparex API</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-600 dark:text-cyan-400 mt-1">•</span>
                <span>Ideal for regular community members</span>
              </li>
            </ul>
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Reward: {rm.light}x multiplier, {fr.light}% fee reduction
              </p>
            </div>
          </div>

          <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 border-cyan-500/50">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Mirror Node</h3>
              <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded-full">Recommended</span>
            </div>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-cyan-600 dark:text-cyan-400 mt-1">•</span>
                <span>Everything Light Node does, plus:</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-600 dark:text-cyan-400 mt-1">•</span>
                <span>Exposes a small HTTP API (read-only)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-600 dark:text-cyan-400 mt-1">•</span>
                <span>Can be used as fallback data source</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-600 dark:text-cyan-400 mt-1">•</span>
                <span>Ideal for power users and partners</span>
              </li>
            </ul>
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Reward: {rm.mirror}x multiplier, {fr.mirror}% fee reduction
              </p>
            </div>
          </div>
        </div>
      </section>

      <NodeTypesInfoCards />

      {/* How to Run */}
      <section id="how-to-run" className="mb-12">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">How to Run a KREX Node</h2>
        <div className="space-y-6">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center font-bold">
                0
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Enroll in the Hub (recommended)</h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-3">
                  Open the Nodes dashboard, connect your Kaspa wallet, and use the <strong>Enroll (get node secret)</strong>{' '}
                  button. This binds your wallet and generates a per-node HMAC secret.
                </p>
                <Link
                  href="/nodes"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold transition-colors"
                >
                  Enroll on Nodes dashboard →
                </Link>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  Tip: enrollment is one-time per node. After that, the runtime sends signed pings every minute.
                </div>
              </div>
            </div>
          </div>

          {/* The rest of the guide stays unchanged in the legacy page; the /nodes tab is meant as a single hub entrypoint. */}
        </div>
      </section>
    </div>
  );
}


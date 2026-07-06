import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import { TableOfContentsSidebar } from '@/components/docs/TableOfContentsSidebar';
import { AdSlider } from '@/components/ads/AdSlider';
import { HubAccentScope } from '@/components/hub/HubAccentScope';
import { HubListingTitleRow } from '@/components/hub/HubListingTitleRow';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';
import { HUB_HALO_DESKTOP_ONLY } from '@/lib/hub/haloHeaders';
import { HUB_MAIN_COLUMN, HUB_MAIN_INNER, HUB_PAGE_BG } from '@/lib/hub/hubLayout';

export const metadata: Metadata = {
  title: 'Kasparex API · api.kasparex.com',
  description: 'The Kasparex API is a lightweight backend service that coordinates KREX Nodes, tracks uptime, calculates rewards, and provides public data for the Kasparex ecosystem.',
};

export default function KasparexAPIPage() {
  return (
    <div className={`flex min-h-screen flex-col ${HUB_PAGE_BG}`}>
      <Header />
      
      <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col lg:flex-row">
        <TableOfContentsSidebar
          storageKeyPrefix="kasparex-api-doc"
          backHref="/dapps"
          backLabel="Back to dApps"
          items={[
            { id: 'what-is-api', title: 'What is the Kasparex API?' },
            { id: 'why-needed', title: 'Why is the Kasparex API needed?' },
            { id: 'what-it-does', title: 'What does the Kasparex API do?' },
            { id: 'api-endpoints', title: 'API Endpoints' },
            { id: 'affects-project', title: 'How the Kasparex API Affects Your Project' },
            { id: 'technical-summary', title: 'Technical Summary' },
            { id: 'vprogs-integration', title: 'Future: vProgs Integration' },
          ]}
        />

        <HubAccentScope projectId="kasparex-dapps" className={HUB_MAIN_COLUMN}>
          <div className={`${HUB_MAIN_INNER} max-w-4xl`}>
          <div className={`relative mb-12 overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-100 via-cyan-50/50 to-zinc-100 px-6 py-12 dark:border-transparent dark:from-zinc-950 dark:via-cyan-950/40 dark:to-zinc-950 ${HUB_HALO_DESKTOP_ONLY}`}>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#06b6d4,transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#0891b2,transparent_50%)]" />
            </div>
            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="w-full text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
                </span>
                api.kasparex.com
              </div>
              <h1 className="mb-6 text-4xl font-black leading-tight text-zinc-900 dark:text-white md:text-6xl">
                Kasparex <span className="bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent dark:from-cyan-400 dark:to-cyan-300">API</span>
              </h1>
              <p className="kx-body mx-auto max-w-2xl leading-relaxed lg:mx-0">
                The coordination brain of the decentralized Kasparex network
              </p>
              </div>
              <div className="relative hidden w-[280px] shrink-0 items-center justify-center lg:flex">
                <div className="pointer-events-none relative opacity-90">
                  <div className="h-56 w-48 rotate-3 transform rounded-2xl border-2 border-cyan-500/30 bg-white/80 shadow-2xl shadow-cyan-500/10 dark:bg-zinc-900/80" />
                </div>
                <div
                  id="ad-slot-api-halo"
                  className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center scroll-mt-24"
                >
                  <AdSlider slotId="HALO_API_RIGHT" />
                </div>
              </div>
            </div>
          </div>

          <div id="content" className="scroll-mt-4" />

          <HubListingTitleRow
            projectId="kasparex-dapps"
            title="API documentation"
            count={7}
            countLabel="section"
            benefits={<HubBenefitsPanel variant="compact" className="w-full" />}
          />

          {/* What is the API */}
          <section id="what-is-api" className="mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              What is the Kasparex API?
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              The Kasparex API is a lightweight backend service that coordinates KREX Nodes, tracks uptime and performance, calculates rewards (GRID + KREX multipliers), and provides public data for the Kasparex frontend and ecosystem.
            </p>
            
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Think of it as:
              </h3>
              <ul className="space-y-3 text-zinc-600 dark:text-zinc-400">
                <li className="flex items-start gap-3">
                  <span className="text-[#02abb8] mt-1">•</span>
                  <div>
                    <strong className="text-zinc-900 dark:text-zinc-100">KREX Nodes</strong> are the body: they pin and mirror data
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#02abb8] mt-1">•</span>
                  <div>
                    <strong className="text-zinc-900 dark:text-zinc-100">Kasparex API</strong> is the brain: it tracks, scores, and coordinates them
                  </div>
                </li>
              </ul>
            </div>

            <div className="p-6 bg-yellow-500/10 dark:bg-yellow-500/20 rounded-xl border border-yellow-500/30">
              <p className="text-zinc-600 dark:text-zinc-400">
                <strong className="text-zinc-900 dark:text-zinc-100">Important:</strong> The Kasparex API does NOT replace Kaspa BlockDAG, Storacha, or IPFS. It simply manages the node network and reward coordination.
              </p>
            </div>
          </section>

          {/* Why is it needed */}
          <section id="why-needed" className="mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              Why is the Kasparex API needed?
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Without the Kasparex API, KREX Nodes would have no identity, uptime tracking, reward calculation, reputation system, or coordination. Decentralized storage (IPFS/Storacha) alone is blind; the Kasparex API gives structure and reward mechanisms to the network.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Node Management</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Allows KREX Nodes to register, send heartbeat pings, and report stats
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Reward Engine</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Calculates and distributes GRID rewards with KREX multipliers
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Public Data</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Provides node lists, dApp availability, and network statistics
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Coordination</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Organizes how dApps find mirror nodes and ensures graceful fallback
                </p>
              </div>
            </div>
          </section>

          {/* API Endpoints */}
          <section id="api-endpoints" className="mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              API Endpoints
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              All endpoints begin with <code className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-sm">/api</code>
            </p>

            {/* Node Management */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                1. Node Management Endpoints
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded text-xs font-mono">POST</span>
                    <code className="text-sm font-mono text-zinc-900 dark:text-zinc-100">/api/node/register</code>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    Nodes call this when they start for the first time to create an identity.
                  </p>
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                    <pre className="text-xs text-zinc-900 dark:text-zinc-100 overflow-x-auto">
{`{
  "nodeName": "MyNode01",
  "role": "light",
  "ownerWallet": "kaspa:q....",
  "version": "1.0.0"
}`}
                    </pre>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded text-xs font-mono">POST</span>
                    <code className="text-sm font-mono text-zinc-900 dark:text-zinc-100">/api/node/ping</code>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    Heartbeat every 60 seconds to report uptime and stats.
                  </p>
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                    <pre className="text-xs text-zinc-900 dark:text-zinc-100 overflow-x-auto">
{`{
  "nodeId": "grid_02f8a9c",
  "uptimeSeconds": 60,
  "pinnedCount": 120,
  "apiRequestsServed": 34,
  "dappRequests": {
    "raffles": 12,
    "heatmap": 5
  }
}`}
                    </pre>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded text-xs font-mono">GET</span>
                    <code className="text-sm font-mono text-zinc-900 dark:text-zinc-100">/api/nodes</code>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Returns list of active nodes for frontend, explorers, and node dashboards.
                  </p>
                </div>
              </div>
            </div>

            {/* Reward Engine */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                2. Reward Engine Endpoints
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded text-xs font-mono">GET</span>
                    <code className="text-sm font-mono text-zinc-900 dark:text-zinc-100">/api/rewards/node/:nodeId</code>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    Returns rewards for a specific node including GRID and multipliers.
                  </p>
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                    <pre className="text-xs text-zinc-900 dark:text-zinc-100 overflow-x-auto">
{`{
  "epoch": "2025-02-08",
  "gridReward": 52,
  "rewardsDetail": {
    "heatmap": 12,
    "raffles": 22
  },
  "multiplier": {
    "role": 2.0,
    "krex": 1.2
  }
}`}
                    </pre>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded text-xs font-mono">GET</span>
                    <code className="text-sm font-mono text-zinc-900 dark:text-zinc-100">/api/rewards/epoch/:epochId</code>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Summary of all rewards in an epoch.
                  </p>
                </div>
              </div>
            </div>

            {/* Public Data */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                3. Public Data Endpoints
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded text-xs font-mono">GET</span>
                    <code className="text-sm font-mono text-zinc-900 dark:text-zinc-100">/api/dapps/availability</code>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    Returns which nodes mirror which dApps. Helps frontend prioritize fast/nearby nodes.
                  </p>
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                    <pre className="text-xs text-zinc-900 dark:text-zinc-100 overflow-x-auto">
{`{
  "raffles": ["grid_02f8a9c", "grid_1aa24fe"],
  "heatmap": ["grid_02f8a9c"],
  "time-locker": []
}`}
                    </pre>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded text-xs font-mono">GET</span>
                    <code className="text-sm font-mono text-zinc-900 dark:text-zinc-100">/api/stats</code>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    General network statistics for dashboards and explorers.
                  </p>
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                    <pre className="text-xs text-zinc-900 dark:text-zinc-100 overflow-x-auto">
{`{
  "nodesOnline": 17,
  "mirrorNodes": 4,
  "lightNodes": 13,
  "totalPinnedCids": 22000,
  "networkHealth": "good"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How it affects the project */}
          <section id="affects-project" className="mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              How the Kasparex API Affects Your Project
            </h2>
            <div className="space-y-4">
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  1. Enables Decentralization
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  KREX Nodes need a place to report, sync, and coordinate. Without this API, they have no network structure.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  2. Enables Rewards
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  You cannot calculate uptime, requests, pinned data, or KREX multipliers without this API. The reward system is impossible without the Kasparex API.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  3. Protects the Marketplace
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  If Vercel/CDN fails, IPFS, Storacha, and KREX Nodes deliver. Frontend discovers memoized mirrors via /api/dapps/availability.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  4. Reduces Costs
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  The Kasparex API redirects &quot;where to download from&quot;. If the API says a mirror node is nearby, the frontend loads metadata from it instead of Vercel.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  5. Enables Dashboards
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  User dashboards can show &quot;My KREX Node: Online/Offline&quot;, rewards, uptime, GRID earnings, and KREX multiplier tier.
                </p>
              </div>
            </div>
          </section>

          {/* Technical Summary */}
          <section id="technical-summary" className="mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              Technical Summary
            </h2>
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Kasparex API is:
              </p>
              <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#02abb8] mt-1">•</span>
                  <span>A lightweight JSON REST API</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#02abb8] mt-1">•</span>
                  <span>Stores node registrations and tracks uptime/performance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#02abb8] mt-1">•</span>
                  <span>Calculates GRID rewards and handles KREX multipliers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#02abb8] mt-1">•</span>
                  <span>Provides data for the frontend and organizes dApp mirror discovery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#02abb8] mt-1">•</span>
                  <span>Ensures graceful fallback if IPFS is slow</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#02abb8] mt-1">•</span>
                  <span>Enables analytics, dashboards, and future features</span>
                </li>
              </ul>
              <p className="text-zinc-600 dark:text-zinc-400 mt-4">
                It is the <strong className="text-zinc-900 dark:text-zinc-100">&quot;network coordinator&quot;</strong> of your decentralized network.
              </p>
            </div>
          </section>

          {/* Future vProgs */}
          <section id="vprogs-integration" className="mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              Future: vProgs Integration
            </h2>
            <div className="p-6 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-xl border border-cyan-500/30">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                When Kaspa smart contracts (vProgs) mature, you could migrate some parts of the Kasparex API logic to vProgs:
              </p>
              <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#02abb8] mt-1">•</span>
                  <span>Reward distribution (store map of wallets → reward totals)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#02abb8] mt-1">•</span>
                  <span>Multiplier tiers (based on KREX balances)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#02abb8] mt-1">•</span>
                  <span>Node reputation (hashed states)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#02abb8] mt-1">•</span>
                  <span>Reward claiming (users claim GRID on-chain)</span>
                </li>
              </ul>
              <p className="text-zinc-600 dark:text-zinc-400 mt-4">
                This becomes a hybrid architecture: <strong className="text-zinc-900 dark:text-zinc-100">Off-chain Kasparex API</strong> collects data and processes heavy logic, while <strong className="text-zinc-900 dark:text-zinc-100">On-chain vProg smart contracts</strong> verify hashed epochs and allow claiming.
              </p>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center p-8 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Learn More
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Explore the Kasparex ecosystem and learn how to run a KREX Node.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              <Link
                href="/nodes?tab=setup"
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-sm transition-colors"
              >
                Run a KREX Node
              </Link>
              <a
                href="https://github.com/Kasparex/kasparex-krex-node"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl font-bold text-sm border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                View on GitHub
              </a>
              <Link
                href="/nodes"
                className="px-6 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl font-bold text-sm border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Nodes Dashboard
              </Link>
            </div>
          </div>
          </div>
        </HubAccentScope>
      </main>

      <Footer />
    </div>
  );
}


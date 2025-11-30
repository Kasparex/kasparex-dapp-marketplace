import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import { TableOfContentsSidebar } from '@/components/docs/TableOfContentsSidebar';

export const metadata: Metadata = {
  title: 'Run a KREX Node · Join Kasparex',
  description: 'Kasparex is a community-powered layer that keeps the Kasparex dApp Marketplace online, fast, and censorship-resistant.',
};

export default function KREXNodePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="flex flex-col lg:flex-row">
          {/* Left Sidebar - Table of Contents */}
          <div className="w-full lg:w-64 lg:flex-shrink-0">
            <TableOfContentsSidebar
              items={[
                { id: 'what-is-krex-node', title: 'What is a KREX Node?' },
                { id: 'node-types', title: 'Node Types' },
                { id: 'how-to-run', title: 'How to Run a KREX Node' },
                { id: 'rewards', title: 'How Rewards Work' },
                { id: 'safety', title: 'Is it Safe?' },
                { id: 'who-is-this-for', title: 'Who is this for?' },
              ]}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Run a KREX Node
            </h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-2">
              Join Kasparex
            </p>
            <p className="text-lg text-zinc-500 dark:text-zinc-500 max-w-2xl mx-auto">
              Kasparex is a community-powered layer that keeps the Kasparex dApp Marketplace online, fast, and censorship-resistant.
            </p>
          </div>

          {/* Key Message */}
          <div className="bg-[#02abb8]/10 dark:bg-[#02abb8]/20 border border-[#02abb8]/30 rounded-lg p-6 mb-12">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Kasparex works even if nobody runs a node
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Core HTML and APIs are always served by Kasparex. KREX Nodes are optional helpers that reduce hosting costs, increase decentralization, and earn rewards for their operators.
            </p>
          </div>

          {/* What is a KREX Node */}
          <section id="what-is-krex-node" className="mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              What is a KREX Node?
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              A KREX Node is a lightweight helper node that you run on your own computer or server. It is <strong>not</strong> a Kaspa BlockDAG node and does not require heavy hardware.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-6 h-6 text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Pin & Mirror</h3>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Downloads dApp metadata from Kasparex and pins files via IPFS / Storacha
                </p>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-6 h-6 text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Censorship-Resistant</h3>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Keeps dApps available even if central servers are down, strengthening the ecosystem
                </p>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-6 h-6 text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Lightweight</h3>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Uses minimal resources (0.2% CPU, 30-60MB RAM) - runs on any machine or Raspberry Pi
                </p>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-6 h-6 text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Earn Rewards</h3>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Earn GRID rewards, Local Reward Tokens (LRT), and benefit from KREX multipliers
                </p>
              </div>
            </div>
          </section>

          {/* Node Types */}
          <section id="node-types" className="mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              Node Types
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                  Light Node
                </h3>
                <ul className="space-y-2 text-zinc-600 dark:text-zinc-400 mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-[#02abb8] mt-1">•</span>
                    <span>Pins IPFS / Storacha CIDs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#02abb8] mt-1">•</span>
                    <span>Caches dApp metadata locally</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#02abb8] mt-1">•</span>
                    <span>Periodically syncs with Kasparex API</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#02abb8] mt-1">•</span>
                    <span>Ideal for regular community members</span>
                  </li>
                </ul>
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Reward: 4x multiplier, 0.1% fee reduction
                  </p>
                </div>
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 border-[#02abb8]/50">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    Mirror Node
                  </h3>
                  <span className="text-xs px-2 py-1 bg-[#02abb8]/20 text-[#02abb8] rounded-full">Recommended</span>
                </div>
                <ul className="space-y-2 text-zinc-600 dark:text-zinc-400 mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-[#02abb8] mt-1">•</span>
                    <span>Everything Light Node does, plus:</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#02abb8] mt-1">•</span>
                    <span>Exposes a small HTTP API (read-only)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#02abb8] mt-1">•</span>
                    <span>Can be used as fallback data source</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#02abb8] mt-1">•</span>
                    <span>Ideal for power users and partners</span>
                  </li>
                </ul>
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Reward: 5x multiplier, 0.2% fee reduction
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How to Run */}
          <section id="how-to-run" className="mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              How to Run a KREX Node
            </h2>
            <div className="space-y-6">
              <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#02abb8] text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                      Install Node.js
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-3">
                      Download Node.js (LTS version) from the official site and install it on your machine.
                    </p>
                    <a
                      href="https://nodejs.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#02abb8] hover:underline text-sm font-medium"
                    >
                      Download Node.js →
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#02abb8] text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                      Download KREX Node
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-3">
                      Clone or download the Kasparex KREX Node repository.
                    </p>
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 font-mono text-sm text-zinc-900 dark:text-zinc-100">
                      git clone https://github.com/Kasparex/kasparex-krex-node.git
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#02abb8] text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                      Install Dependencies
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-3">
                      Open a terminal in the node folder and run:
                    </p>
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 font-mono text-sm text-zinc-900 dark:text-zinc-100">
                      npm install
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#02abb8] text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                      Start the Node
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-3">
                      Run the node:
                    </p>
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 font-mono text-sm text-zinc-900 dark:text-zinc-100 mb-3">
                      npm start
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      The node will sync base data from Kasparex, start pinning configured CIDs, and report its status in the terminal.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#02abb8] text-white rounded-full flex items-center justify-center font-bold">
                    5
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                      Run as Background Service (Optional)
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-3">
                      Advanced users can use tools like pm2 to keep the node running persistently:
                    </p>
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 font-mono text-sm text-zinc-900 dark:text-zinc-100">
                      npm install -g pm2<br />
                      pm2 start src/index.js --name krex-node<br />
                      pm2 save
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Rewards Section */}
          <section id="rewards" className="mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              How Rewards Work
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              The reward engine works in epochs (for example, once per day). During each epoch, your node sends small status pings to Kasparex API.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  GRID Rewards (Global)
                </h3>
                <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <li className="flex items-start gap-2">
                    <span className="text-[#02abb8] mt-1">•</span>
                    <span>Base reward per epoch based on uptime</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#02abb8] mt-1">•</span>
                    <span>Multiplied by pinned files count</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#02abb8] mt-1">•</span>
                    <span>Multiplied by requests served (Mirror Nodes)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#02abb8] mt-1">•</span>
                    <span>Multiplied by KREX holdings tier</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  LRT Rewards (Local)
                </h3>
                <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <li className="flex items-start gap-2">
                    <span className="text-[#02abb8] mt-1">•</span>
                    <span>Earn Local Reward Tokens per dApp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#02abb8] mt-1">•</span>
                    <span>Proportional to requests served for that dApp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#02abb8] mt-1">•</span>
                    <span>Also multiplied by KREX tier</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#02abb8] mt-1">•</span>
                    <span>Example: Serve Heatmap dApp → earn HEAT tokens</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-6 bg-[#02abb8]/10 dark:bg-[#02abb8]/20 rounded-lg border border-[#02abb8]/30">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                KREX Multiplier Tiers
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">0 KREX:</span>
                  <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">1.0x</span>
                </div>
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">100k KREX:</span>
                  <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">1.05x</span>
                </div>
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">500k KREX:</span>
                  <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">1.1x</span>
                </div>
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">1M KREX:</span>
                  <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">1.2x</span>
                </div>
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">5M KREX:</span>
                  <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">1.3x</span>
                </div>
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">10M+ KREX:</span>
                  <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">1.5x</span>
                </div>
              </div>
            </div>
          </section>

          {/* Safety & Requirements */}
          <section id="safety" className="mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              Is it Safe?
            </h2>
            <div className="p-6 bg-green-500/10 dark:bg-green-500/20 rounded-lg border border-green-500/30">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                A KREX Node:
              </p>
              <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                  <span>Does not access your wallets or private keys</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                  <span>Does not require your Kasparex account password</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                  <span>Only handles public dApp metadata and static files</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                  <span>You always control when to start or stop your node</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Who is this for */}
          <section id="who-is-this-for" className="mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              Who is this for?
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">KREX Holders</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Support the ecosystem and earn boosted rewards with KREX multipliers
                </p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Technical Users</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Enjoy running nodes and contributing to decentralized infrastructure
                </p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Partners & Builders</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Ensure extra resilience for your dApps and help the entire marketplace
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center p-8 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Join Kasparex and help build a decentralized, censorship-resistant dApp marketplace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://github.com/Kasparex/kasparex-krex-node"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
              >
                View on GitHub
              </a>
              <Link
                href="/api"
                className="px-6 py-3 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
              >
                Learn about the API
              </Link>
            </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


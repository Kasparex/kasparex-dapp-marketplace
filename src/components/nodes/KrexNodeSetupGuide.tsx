import Link from 'next/link';
import nodeRewardTiers from '@/config/node-reward-tiers.json';
import { NODES_DASH_CARD } from './nodesTabLayout';

const rm = nodeRewardTiers.roleMultipliers as Record<string, number>;
const fr = nodeRewardTiers.feeReductionPercent as Record<string, number>;

const SUBCARD =
  'p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50';

/**
 * Practical setup content for `/nodes` (Setup tab) - same card shell as the dashboard.
 */
export function KrexNodeSetupGuide() {
  return (
    <div className="space-y-6 w-full min-w-0">
      <section>
        <div className={`${NODES_DASH_CARD} space-y-4`} id="what-is-krex-node">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">What is a KREX Node?</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            A KREX Node is a lightweight helper you run on your own hardware. It is <strong>not</strong> a Kaspa BlockDAG node
            and stays small on CPU and RAM.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className={SUBCARD}>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1">Pin &amp; mirror</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Pulls dApp metadata from Kasparex and pins assets via IPFS / Storacha where configured.
              </p>
            </div>
            <div className={SUBCARD}>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1">Resilient reads</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Optional node-first routing helps keep read-heavy endpoints responsive as the network grows.
              </p>
            </div>
            <div className={SUBCARD}>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1">Lightweight</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">128–256 MB RAM and low CPU - suitable for VPS or Raspberry Pi.</p>
            </div>
            <div className={SUBCARD}>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1">Rewards</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Eligible operators can earn GRID and fee reductions via configured tiers.</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className={`${NODES_DASH_CARD} space-y-4`} id="node-types-setup">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Node types</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Light</h3>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc pl-4">
                <li>Pins IPFS / Storacha CIDs</li>
                <li>Caches dApp metadata locally</li>
                <li>Syncs periodically with the Kasparex API</li>
              </ul>
              <p className="mt-3 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {rm.light}x multiplier · {fr.light}% fee reduction
              </p>
            </div>
            <div className="p-5 rounded-xl border border-cyan-500/30 dark:border-cyan-500/25 bg-zinc-50 dark:bg-zinc-950/40">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Mirror</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold uppercase">
                  Recommended
                </span>
              </div>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc pl-4">
                <li>Everything Light does</li>
                <li>Small read-only HTTP surface for fallbacks</li>
                <li>Best for stable hosts and partners</li>
              </ul>
              <p className="mt-3 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {rm.mirror}x multiplier · {fr.mirror}% fee reduction
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className={`${NODES_DASH_CARD} space-y-4`} id="how-to-run">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">How to run</h2>
          <ol className="list-decimal pl-5 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Enroll</span> - connect your Kaspa wallet on this
              page and use the <strong>Enroll</strong> tab (or the header action) to bind your wallet and receive a node secret.
            </li>
            <li>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Install</span> - use{' '}
              <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">packages/krex-node</code> or the{' '}
              <a
                href="https://github.com/Kasparex/kasparex-krex-node"
                className="text-cyan-700 dark:text-cyan-300 font-semibold underline-offset-2 hover:underline"
              >
                standalone repo
              </a>
              .
            </li>
            <li>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Configure</span> - point{' '}
              <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">apiBaseUrl</code> at the production Worker URL and
              set <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">nodeId</code> /{' '}
              <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">hmacSecret</code> from enrollment.
            </li>
          </ol>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/nodes?tab=enroll"
              scroll={false}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#02abb8] hover:bg-[#02919c] text-white font-bold text-sm transition-colors"
            >
              Open Enroll tab
            </Link>
            <Link
              href="/nodes?tab=docs"
              scroll={false}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 font-semibold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Read docs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

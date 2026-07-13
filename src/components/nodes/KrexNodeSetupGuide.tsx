'use client';

import Link from 'next/link';
import { NODES_DASH_CARD } from './nodesTabLayout';
import {
  KREX_NODE_CLONE_HINT,
  KREX_NODE_MARKETPLACE_REPO,
  KREX_NODE_PACKAGE_GITHUB,
} from '@/lib/nodes/operator-links';

const SUBCARD =
  'p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50';

const CODE = 'text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono';

/**
 * Practical setup content for `/nodes` (Setup tab).
 */
export function KrexNodeSetupGuide() {
  return (
    <div className="space-y-6 w-full min-w-0">
      <section>
        <div className={`${NODES_DASH_CARD} space-y-4`} id="what-is-krex-node">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">What is a KREX Node?</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            A small helper you run on your own PC or VPS. It is <strong>not</strong> a Kaspa BlockDAG node. It sends
            heartbeats to Kasparex, can cache Hub IPFS files, and (Serve role) run a small HTTP server on your machine.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className={SUBCARD}>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1">Pin &amp; serve</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Serve nodes cache catalog files locally. Public HTTPS URL is optional (see domain table below).
              </p>
            </div>
            <div className={SUBCARD}>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1">Resilient reads</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Serve nodes with a <strong>public HTTPS URL</strong> can help other Hub users (optional).
              </p>
            </div>
            <div className={SUBCARD}>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1">Lightweight</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Low CPU/RAM. Fine on a home PC or small VPS.</p>
            </div>
            <div className={SUBCARD}>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1">Rewards</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Hub Points on your wallet. Redeem on the Rewards catalog.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className={`${NODES_DASH_CARD} space-y-4`} id="domain-faq">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Do I need a domain?</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-2 pr-4 font-semibold text-zinc-900 dark:text-zinc-100">Goal</th>
                  <th className="py-2 font-semibold text-zinc-900 dark:text-zinc-100">Domain?</th>
                </tr>
              </thead>
              <tbody className="text-zinc-600 dark:text-zinc-400">
                <tr className="border-b border-zinc-100 dark:border-zinc-800/80">
                  <td className="py-2 pr-4">Enroll, earn points, run on your PC</td>
                  <td className="py-2 font-semibold text-emerald-700 dark:text-emerald-400">No</td>
                </tr>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/80">
                  <td className="py-2 pr-4">Local testing (<code className={CODE}>localhost:8788</code>)</td>
                  <td className="py-2 font-semibold text-emerald-700 dark:text-emerald-400">No</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Help other Hub users (public HTTPS on a Serve node)</td>
                  <td className="py-2 font-semibold text-amber-700 dark:text-amber-400">Yes (HTTPS URL)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Start without a domain. Add a public URL later when you are ready (Cloudflare Tunnel or VPS). See Docs tab
            and knowledge base.
          </p>
        </div>
      </section>

      <section>
        <div className={`${NODES_DASH_CARD} space-y-4`} id="node-types-setup">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Node types</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Light</h3>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc pl-4">
                <li>Heartbeats + IPFS pin cache</li>
                <li>No public HTTP server</li>
                <li>Command: <code className={CODE}>npm run heartbeat</code> or <code className={CODE}>light</code></li>
              </ul>
              <p className="mt-3 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                +1,000 Hub Points on enroll · +250 base per qualified online day (× KREX tier)
              </p>
            </div>
            <div className="p-5 rounded-xl border border-cyan-500/30 dark:border-cyan-500/25 bg-zinc-50 dark:bg-zinc-950/40">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Serve</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold uppercase">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">
                Config role: <code className={CODE}>mirror</code> (technical name).
              </p>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc pl-4">
                <li>Everything Light does</li>
                <li>HTTP on your machine (localhost OK)</li>
                <li>Public HTTPS later if you want to help others</li>
                <li>Command: <code className={CODE}>npm run mirror</code> or PM2</li>
              </ul>
              <p className="mt-3 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                +1,000 Hub Points on enroll · +250 base per qualified online day (× KREX tier)
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className={`${NODES_DASH_CARD} space-y-4`} id="how-to-run">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">How to run (5 steps)</h2>
          <ol className="list-decimal pl-5 space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Enroll on this page</span>
              <p className="mt-1">
                Connect wallet → <strong>Enroll</strong> tab → save <code className={CODE}>nodeId</code> and{' '}
                <code className={CODE}>hmacSecret</code>.
              </p>
            </li>
            <li>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Get the software</span>
              <p className="mt-1">
                Operator code is <code className={CODE}>packages/krex-node</code> in the marketplace repo (not a separate
                GitHub project):
              </p>
              <pre className="mt-2 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs overflow-x-auto">{`${KREX_NODE_CLONE_HINT}
cd kasparex-dapp-marketplace/packages/krex-node`}</pre>
            </li>
            <li>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Configure</span>
              <p className="mt-1">
                <code className={CODE}>cp config.example.json config.json</code> then set{' '}
                <code className={CODE}>nodeId</code>, <code className={CODE}>hmacSecret</code>,{' '}
                <code className={CODE}>role</code>, and <code className={CODE}>url</code> (
                <code className={CODE}>http://localhost:8788</code> is fine to start).
              </p>
            </li>
            <li>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Build and run</span>
              <pre className="mt-2 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs overflow-x-auto">{`npm install
npm run build
npm run mirror`}</pre>
            </li>
            <li>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Keep it online</span>
              <p className="mt-1">
                Use PM2 so it survives reboots: <code className={CODE}>pm2 start ecosystem.config.cjs</code> then{' '}
                <code className={CODE}>scripts\\pm2-boot-setup.bat</code> on Windows.
              </p>
            </li>
          </ol>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            More questions?{' '}
            <Link href="/nodes?tab=faq" className="text-cyan-700 dark:text-cyan-300 font-semibold hover:underline">
              FAQ tab
            </Link>
            {' · '}
            <Link href="/knowledge-base/krex-node-faq" className="text-cyan-700 dark:text-cyan-300 font-semibold hover:underline">
              Knowledge base FAQ
            </Link>
            {' · '}
            <Link href="/knowledge-base/krex-node-setup" className="text-cyan-700 dark:text-cyan-300 font-semibold hover:underline">
              Knowledge base → Setup
            </Link>
            {' · '}
            <a
              href={KREX_NODE_PACKAGE_GITHUB}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-700 dark:text-cyan-300 font-semibold hover:underline"
            >
              packages/krex-node on GitHub
            </a>
          </p>
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
            <a
              href={KREX_NODE_MARKETPLACE_REPO}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 font-semibold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Marketplace repo
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

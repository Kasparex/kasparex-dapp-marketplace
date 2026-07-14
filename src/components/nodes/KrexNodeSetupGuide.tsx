'use client';

import Link from 'next/link';
import { NODES_DASH_CARD } from './nodesTabLayout';
import { CopyableCommandBlock } from './CopyableCommandBlock';
import {
  KREX_NODE_CLONE_HINT,
  KREX_NODE_MARKETPLACE_REPO,
  KREX_NODE_PACKAGE_GITHUB,
} from '@/lib/nodes/operator-links';
import { dailyPtsLabel, enrollPtsLabel } from '@/lib/nodes/node-role';

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
            heartbeats to Kasparex, can cache Hub IPFS files, and (Edge role) serves a public HTTPS read API for other Hub users.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className={SUBCARD}>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1">Pin &amp; serve</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Edge nodes cache catalog files and serve reads over public HTTPS.
              </p>
            </div>
            <div className={SUBCARD}>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1">Resilient reads</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Edge nodes offload read traffic from central servers for all Hub visitors.
              </p>
            </div>
            <div className={SUBCARD}>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1">Lightweight</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Low CPU/RAM. Fine on a home PC or small VPS.</p>
            </div>
            <div className={SUBCARD}>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1">Rewards</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Hub Points on your wallet ({enrollPtsLabel()} enroll). Redeem on Rewards.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className={`${NODES_DASH_CARD} space-y-4`} id="get-public-url">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Get your public HTTPS URL (Edge / Super)</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Edge enrollment needs a URL that works in any browser, for example{' '}
            <code className={CODE}>https://something.trycloudflare.com</code> or{' '}
            <code className={CODE}>https://edge.yourdomain.com</code>. You create this on <strong>your PC</strong>, not
            inside the Hub. Pick one path below.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 dark:bg-cyan-950/20 space-y-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Path A: Quick tunnel (free, testing)</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Best for first enroll. No domain purchase. URL changes when you restart the tunnel.
              </p>
              <ol className="list-decimal pl-4 space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                <li>Install cloudflared (once)</li>
                <li>Start your edge locally (<code className={CODE}>npm run edge</code>)</li>
                <li>Run the tunnel command in a second terminal</li>
                <li>Copy the printed <code className={CODE}>https://….trycloudflare.com</code> URL</li>
                <li>Paste that URL in Enroll and in <code className={CODE}>config.json</code></li>
              </ol>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Windows: install cloudflared</p>
              <CopyableCommandBlock command="winget install --id Cloudflare.cloudflared -e" />
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Windows: start quick tunnel</p>
              <CopyableCommandBlock command={'"C:\\Program Files (x86)\\cloudflared\\cloudflared.exe" tunnel --url http://127.0.0.1:8788'} />
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">macOS / Linux</p>
              <CopyableCommandBlock command="cloudflared tunnel --url http://127.0.0.1:8788" />
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Verify: open <code className={CODE}>https://YOUR-URL/health</code> on your phone. Keep the tunnel terminal open.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Path B: Your own subdomain (production)</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Stable URL like <code className={CODE}>https://edge.yourdomain.com</code>. Needs a domain you control with DNS
                at Cloudflare (Wix-only DNS is not enough for named tunnels).
              </p>
              <ol className="list-decimal pl-4 space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                <li>Add domain to Cloudflare and use Cloudflare nameservers</li>
                <li>Create a named tunnel and route <code className={CODE}>edge.yourdomain.com</code></li>
                <li>Enroll with that HTTPS URL</li>
              </ol>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Named tunnel (after cloudflared login)</p>
              <CopyableCommandBlock command={`cloudflared tunnel login\ncloudflared tunnel create krex-edge\ncloudflared tunnel route dns krex-edge edge.yourdomain.com`} />
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Details: <code className={CODE}>docs/KREX_NODE_CLOUDFLARE_DNS.md</code> and{' '}
                <code className={CODE}>docs/KREX_NODE_PUBLIC_EDGE.md</code> in the marketplace repo.
              </p>
            </div>
          </div>

          <div className={`${SUBCARD} text-xs text-zinc-600 dark:text-zinc-400 space-y-1`}>
            <p>
              <strong className="text-zinc-800 dark:text-zinc-200">Light node?</strong> Skip this section. Light does not need a public URL.
            </p>
            <p>
              <strong className="text-zinc-800 dark:text-zinc-200">Hub URL must match config.</strong> After enroll, set the same URL in{' '}
              <code className={CODE}>packages/krex-node/config.json</code> and restart PM2.
            </p>
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
                  <td className="py-2 pr-4">Light node (heartbeats + pins only)</td>
                  <td className="py-2 font-semibold text-emerald-700 dark:text-emerald-400">No</td>
                </tr>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/80">
                  <td className="py-2 pr-4">Local testing (<code className={CODE}>localhost:8788</code>, not enrolled)</td>
                  <td className="py-2 font-semibold text-emerald-700 dark:text-emerald-400">No</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Enroll Edge or Super (public helper)</td>
                  <td className="py-2 font-semibold text-amber-700 dark:text-amber-400">
                    Yes (HTTPS URL). Use Path A quick tunnel or Path B own subdomain above.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            See <strong>Get your public HTTPS URL</strong> above for copy-paste commands. Docs:{' '}
            <code className={CODE}>docs/KREX_NODE_PUBLIC_EDGE.md</code>.
          </p>
        </div>
      </section>

      <section>
        <div className={`${NODES_DASH_CARD} space-y-4`} id="node-types-setup">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Node types: Light · Edge · Super</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Light</h3>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc pl-4">
                <li>Heartbeats + IPFS pin cache</li>
                <li>No public HTTP server</li>
                <li>Command: <code className={CODE}>npm run light</code></li>
              </ul>
              <p className="mt-3 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                500 enroll · 100 base/day (× KREX tier)
              </p>
            </div>
            <div className="p-5 rounded-xl border border-cyan-500/30 dark:border-cyan-500/25 bg-zinc-50 dark:bg-zinc-950/40">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Edge</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold uppercase">
                  Recommended
                </span>
              </div>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc pl-4">
                <li>Everything Light does</li>
                <li>Public HTTPS read API (required at enroll)</li>
                <li>Test on localhost, enroll with tunnel URL</li>
                <li>Command: <code className={CODE}>npm run edge</code> or PM2</li>
              </ul>
              <p className="mt-3 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                700 enroll · 250 base/day (× KREX tier)
              </p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Super: 1,000 enroll · 500 base/day when enabled for your account. Daily tiers: {dailyPtsLabel()}.
          </p>
        </div>
      </section>

      <section>
        <div className={`${NODES_DASH_CARD} space-y-4`} id="how-to-run">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">How to run (step by step)</h2>
          <ol className="list-decimal pl-5 space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Get the software</span>
              <CopyableCommandBlock command={`${KREX_NODE_CLONE_HINT}\ncd kasparex-dapp-marketplace/packages/krex-node\nnpm install && npm run build`} />
            </li>
            <li>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Test locally</span>
              <CopyableCommandBlock command="npm run edge" />
              <p className="mt-2">
                Open <code className={CODE}>http://localhost:8788/health</code> on your machine. You should see JSON with{' '}
                <code className={CODE}>&quot;status&quot;:&quot;ok&quot;</code>.
              </p>
            </li>
            <li>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Get a public HTTPS URL (Edge only)</span>
              <p className="mt-1">
                Use <strong>Path A</strong> (quick tunnel) or <strong>Path B</strong> (own subdomain) in the section above. Copy the full{' '}
                <code className={CODE}>https://…</code> URL.
              </p>
            </li>
            <li>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Enroll on this page</span>
              <p className="mt-1">
                Connect wallet → <strong>Enroll</strong> tab → role <strong>Edge</strong> → paste your HTTPS URL → save{' '}
                <code className={CODE}>nodeId</code> and <code className={CODE}>hmacSecret</code>.
              </p>
            </li>
            <li>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Configure</span>
              <CopyableCommandBlock command="cp config.example.json config.json" />
              <p className="mt-2">
                Set <code className={CODE}>nodeId</code>, <code className={CODE}>hmacSecret</code>,{' '}
                <code className={CODE}>role: &quot;edge&quot;</code>, and the <strong>same</strong> HTTPS{' '}
                <code className={CODE}>url</code> you used in Enroll.
              </p>
            </li>
            <li>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Keep it online</span>
              <CopyableCommandBlock command={`pm2 start ecosystem.config.cjs\npm2 save`} />
              <p className="mt-2">
                Windows boot: <code className={CODE}>scripts\\pm2-boot-setup.bat</code>. Keep cloudflared running too if you use a tunnel.
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

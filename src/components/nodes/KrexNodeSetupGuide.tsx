'use client';

import Link from 'next/link';
import { NODES_DASH_CARD } from './nodesTabLayout';
import { CopyableCommandBlock } from './CopyableCommandBlock';
import { GuideStep, GuideTerm, GuideTipBox } from './NodeGuideUi';
import {
  KREX_NODE_CLONE_HINT,
  KREX_NODE_MARKETPLACE_REPO,
  KREX_NODE_PACKAGE_GITHUB,
} from '@/lib/nodes/operator-links';
import { dailyPtsLabel } from '@/lib/nodes/node-role';

const CODE = 'text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono';

/**
 * Beginner-friendly setup content for `/nodes` (Setup tab).
 */
export function KrexNodeSetupGuide() {
  return (
    <div className="space-y-6 w-full min-w-0">
      {/* 1. Basics */}
      <section>
        <div className={`${NODES_DASH_CARD} space-y-4`} id="what-is-krex-node">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">What is a KREX Node?</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            A small helper program you run on <strong>your own computer</strong>. It tells Kasparex &quot;I am online&quot; and can
            help other users load Hub data faster.
          </p>
          <GuideTipBox variant="info">
            This is <strong>not</strong> a full Kaspa blockchain node. You do not need mining gear or a massive server.
          </GuideTipBox>
          <div className="grid sm:grid-cols-2 gap-3">
            <GuideTipBox variant="success" title="Why run one?">
              Help the Hub stay fast. Earn <GuideTerm tip="Points on your Kaspa wallet. Redeem them on the Rewards page.">Hub Points</GuideTerm> while
              your node is online.
            </GuideTipBox>
            <GuideTipBox variant="tip">
              Runs in the background on a home PC or small cloud server. Low CPU and RAM.
            </GuideTipBox>
          </div>
        </div>
      </section>

      {/* 2. Pick a type */}
      <section>
        <div className={`${NODES_DASH_CARD} space-y-4`} id="node-types-setup">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Choose your node type</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Not sure? Start with <strong>Edge</strong>. It is the best balance of rewards and helping other users.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-2">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Light</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Easiest start. No public link needed.</p>
              <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 list-disc pl-4">
                <li>Sends online pings</li>
                <li>Stores Hub files locally</li>
              </ul>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 pt-1">
                500 pts enroll · 100/day
              </p>
            </div>

            <div className="p-5 rounded-xl border-2 border-cyan-500/40 bg-cyan-500/5 dark:bg-cyan-950/20 space-y-2 relative">
              <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 font-bold uppercase">
                Recommended
              </span>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Edge</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Everything Light does, plus a <GuideTerm tip="A web address anyone can open, starting with https://">public link</GuideTerm> that
                helps other visitors.
              </p>
              <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 list-disc pl-4">
                <li>Needs a free or own HTTPS link at enroll</li>
                <li>Best for most operators</li>
              </ul>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 pt-1">
                700 pts enroll · 250/day
              </p>
            </div>

            <div className="p-5 rounded-xl border border-violet-500/30 bg-violet-500/5 dark:bg-violet-950/15 space-y-2">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Super</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Top tier for advanced operators. Coming soon on Hub.</p>
              <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 list-disc pl-4">
                <li>Same public link requirement as Edge</li>
                <li>Highest rewards when enabled</li>
              </ul>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 pt-1">
                1,000 pts enroll · 500/day
              </p>
              <GuideTipBox variant="warn" title="Soon">
                Enrollment wiring is in progress. Use Edge for now.
              </GuideTipBox>
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Daily points scale with your KREX tier: {dailyPtsLabel()}.
          </p>
        </div>
      </section>

      {/* 3. Domain quick answer */}
      <section>
        <div className={`${NODES_DASH_CARD} space-y-4`} id="domain-faq">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Do I need to buy a domain?</h2>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <GuideTipBox variant="success">
              <strong>Light:</strong> No link required.
            </GuideTipBox>
            <GuideTipBox variant="tip">
              <strong>Edge (testing):</strong> No purchase. Use a free{' '}
              <GuideTerm tip="Cloudflare gives you a random free link when you run one command on your PC.">trycloudflare</GuideTerm> link.
            </GuideTipBox>
            <GuideTipBox variant="info">
              <strong>Edge (long term):</strong> Your own link like <code className={CODE}>edge.yourdomain.com</code> is more stable.
            </GuideTipBox>
          </div>
        </div>
      </section>

      {/* 4. Step by step */}
      <section>
        <div className={`${NODES_DASH_CARD} space-y-5`} id="how-to-run">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Start in 6 steps</h2>
          <GuideTipBox variant="tip">
            New here? Follow the steps in order. Each command block has a <strong>Copy</strong> button.
          </GuideTipBox>
          <ol className="space-y-5 list-none pl-0">
            <GuideStep n={1} title="Download the node app">
              <CopyableCommandBlock command={`${KREX_NODE_CLONE_HINT}\ncd kasparex-dapp-marketplace/packages/krex-node\nnpm install && npm run build`} />
            </GuideStep>
            <GuideStep n={2} title="Make sure it runs on your PC">
              <CopyableCommandBlock command="npm run edge" />
              <p>
                Open <code className={CODE}>http://localhost:8788/health</code> in your browser. You should see{' '}
                <code className={CODE}>status: ok</code>.
              </p>
            </GuideStep>
            <GuideStep n={3} title="Get a public link (Edge or Super only)">
              <p>
                Skip this if you chose <strong>Light</strong>. For Edge, use the free path below or your own domain later.
              </p>
              <Link href="#get-public-url" className="text-cyan-700 dark:text-cyan-300 font-semibold text-xs hover:underline">
                Jump to: Get your public link
              </Link>
            </GuideStep>
            <GuideStep n={4} title="Enroll on this website">
              <p>
                Connect wallet → <strong>Enroll</strong> tab → pick your role → paste your public link → save your{' '}
                <GuideTerm tip="Secret codes from enroll. You paste them into config.json on your PC. Never share hmacSecret.">node ID and secret</GuideTerm>.
              </p>
              <Link
                href="/nodes?tab=enroll"
                scroll={false}
                className="inline-flex mt-1 px-3 py-1.5 rounded-lg bg-[#02abb8] text-white text-xs font-bold hover:bg-[#02919c]"
              >
                Open Enroll tab
              </Link>
            </GuideStep>
            <GuideStep n={5} title="Paste secrets into config.json">
              <CopyableCommandBlock command="cp config.example.json config.json" />
              <p>
                Set the same public link you used in Enroll. File lives in{' '}
                <code className={CODE}>packages/krex-node/config.json</code>.
              </p>
            </GuideStep>
            <GuideStep n={6} title="Keep it running">
              <CopyableCommandBlock command={`pm2 start ecosystem.config.cjs\npm2 save`} />
              <p>
                If you use a free tunnel, keep that terminal open too. Windows auto-start:{' '}
                <code className={CODE}>scripts\pm2-boot-setup.bat</code>.
              </p>
            </GuideStep>
          </ol>
        </div>
      </section>

      {/* 5. Public URL paths */}
      <section>
        <div className={`${NODES_DASH_CARD} space-y-4`} id="get-public-url">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Get your public link (Edge / Super)</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            The Hub does <strong>not</strong> create this link for you. You run one extra program on your PC. Pick a path:
          </p>

          <GuideTipBox variant="warn">
            The link in <strong>Enroll</strong> and in <strong>config.json</strong> must match. Update both if your link changes.
          </GuideTipBox>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border-2 border-cyan-500/35 bg-cyan-500/5 dark:bg-cyan-950/20 space-y-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Path A · Free test link</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Best for your first enroll. Costs nothing. Link changes if you restart the tunnel.
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                <li>Terminal 1: <code className={CODE}>npm run edge</code></li>
                <li>Terminal 2: run a command below</li>
                <li>Copy the <code className={CODE}>https://….trycloudflare.com</code> line</li>
                <li>Paste into Enroll + config.json</li>
              </ol>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Windows · install once</p>
              <CopyableCommandBlock command="winget install --id Cloudflare.cloudflared -e" />
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Windows · start tunnel</p>
              <CopyableCommandBlock command={'"C:\\Program Files (x86)\\cloudflared\\cloudflared.exe" tunnel --url http://127.0.0.1:8788'} />
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Mac / Linux</p>
              <CopyableCommandBlock command="cloudflared tunnel --url http://127.0.0.1:8788" />
              <GuideTipBox variant="tip">
                Test on your phone: open <code className={CODE}>YOUR-LINK/health</code>. Keep the tunnel window open.
              </GuideTipBox>
            </div>

            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Path B · Your own subdomain</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Stable link like <code className={CODE}>https://edge.yourdomain.com</code>. Needs{' '}
                <GuideTerm tip="Where your domain records live. Cloudflare is the usual choice for Edge nodes.">DNS at Cloudflare</GuideTerm>.
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                <li>Add domain to Cloudflare</li>
                <li>Copy your old DNS records (Wix, etc.)</li>
                <li>Create a named tunnel</li>
                <li>Enroll with your HTTPS link</li>
              </ol>
              <CopyableCommandBlock command={`cloudflared tunnel login\ncloudflared tunnel create krex-edge\ncloudflared tunnel route dns krex-edge edge.yourdomain.com`} />
              <GuideTipBox variant="info">
                Wix-only DNS is not enough for a stable edge link. See FAQ: &quot;Transfer domain to Cloudflare?&quot;
              </GuideTipBox>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className={`${NODES_DASH_CARD} flex flex-wrap gap-3`}>
          <Link
            href="/nodes?tab=enroll"
            scroll={false}
            className="inline-flex px-4 py-2.5 rounded-xl bg-[#02abb8] hover:bg-[#02919c] text-white font-bold text-sm"
          >
            Open Enroll tab
          </Link>
          <Link
            href="/nodes?tab=faq"
            scroll={false}
            className="inline-flex px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 font-semibold text-sm"
          >
            Read FAQ
          </Link>
          <a
            href={KREX_NODE_PACKAGE_GITHUB}
            target="_blank"
            rel="noreferrer"
            className="inline-flex px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 font-semibold text-sm"
          >
            GitHub package
          </a>
          <a
            href={KREX_NODE_MARKETPLACE_REPO}
            target="_blank"
            rel="noreferrer"
            className="inline-flex px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 font-semibold text-sm"
          >
            Marketplace repo
          </a>
        </div>
      </section>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { NODES_DASH_CARD } from './nodesTabLayout';
import { KREX_NODE_PACKAGE_GITHUB } from '@/lib/nodes/operator-links';
import { dailyPtsLabel, enrollPtsLabel } from '@/lib/nodes/node-role';

const FAQ = [
  {
    id: 'what-is-it',
    q: 'What is a KREX Node?',
    a: (
      <>
        A small program on <strong>your</strong> computer or VPS. It is <strong>not</strong> a Kaspa BlockDAG full node. It
        sends &quot;I am online&quot; pings to Kasparex, can store Hub files locally, and (Edge role) serves a public HTTPS read API
        for other Hub users.
      </>
    ),
  },
  {
    id: 'wrong-repo',
    q: 'Where do I download it? (kasparex-krex-node?)',
    a: (
      <>
        There is <strong>no</strong> separate <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">kasparex-krex-node</code>{' '}
        repo today. Use{' '}
        <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">packages/krex-node</code> inside{' '}
        <a href={KREX_NODE_PACKAGE_GITHUB} className="text-cyan-700 dark:text-cyan-300 font-semibold hover:underline" target="_blank" rel="noreferrer">
          kasparex-dapp-marketplace
        </a>
        . See the Setup tab for clone commands.
      </>
    ),
  },
  {
    id: 'domain',
    q: 'Do I need a domain name?',
    a: (
      <>
        <strong>Light:</strong> no public URL required.
        <br />
        <strong>Edge / Super:</strong> yes. Enrollment requires a <strong>public HTTPS URL</strong> (domain + tunnel or VPS).
        Test on <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">localhost:8788</code> first, then enroll with your HTTPS address.
      </>
    ),
  },
  {
    id: 'local-vs-enroll',
    q: 'Can I test locally before enrolling?',
    a: (
      <>
        <strong>Yes.</strong> Run <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">npm run edge</code> and hit{' '}
        <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">http://localhost:8788/health</code> on your machine only.
        Do <strong>not</strong> register localhost in the Hub. Enroll only after your Cloudflare Tunnel or VPS exposes HTTPS.
      </>
    ),
  },
  {
    id: 'public-helper',
    q: 'What is a &quot;public helper&quot;?',
    a: (
      <>
        An enrolled <strong>Edge</strong> or <strong>Super</strong> node with a public HTTPS URL. The Kasparex website can send some{' '}
        <strong>read-only</strong> requests to you (wallet deck, token lookups, cached images, etc.) instead of always hitting the central server.
      </>
    ),
  },
  {
    id: 'share-url',
    q: 'Can many operators share one public URL?',
    a: (
      <>
        <strong>No.</strong> Each operator enrolls their own wallet, runs their own software, and registers their own HTTPS URL.
      </>
    ),
  },
  {
    id: 'node-down',
    q: 'If my public node goes offline, does it break Kasparex?',
    a: (
      <>
        <strong>No.</strong> The Hub tries other operator edge nodes, then falls back to the central API.
      </>
    ),
  },
  {
    id: 'more-nodes',
    q: 'Are more public edge nodes better?',
    a: (
      <>
        <strong>Yes.</strong> More healthy edge nodes spread read traffic, reduce load on central servers, and add backup paths.
      </>
    ),
  },
  {
    id: 'run-vs-visit',
    q: 'Running a node vs just using the website?',
    a: (
      <>
        <strong>Using the website</strong> = normal visitor (wallet, dApps, Rewards).
        <br />
        <strong>Running a node</strong> = operator job on your PC or VPS (separate program, Enroll tab, config.json).
      </>
    ),
  },
  {
    id: 'rewards',
    q: 'What do operators earn?',
    a: (
      <>
        <strong>Hub Points</strong> on your enrolled Kaspa wallet (× KREX tier on daily credits).
        <br />
        Enroll: {enrollPtsLabel()}.
        <br />
        Daily qualified online day: {dailyPtsLabel()} base each.
        <br />
        Redeem on the Rewards catalog.
      </>
    ),
  },
  {
    id: 'nft-future',
    q: 'Will operator NFTs / gamification exist?',
    a: (
      <>
        <strong>Not live today.</strong> Possible later as cosmetic flair with strict caps. Not required to operate a node.
      </>
    ),
  },
  {
    id: 'need-kaspa-node',
    q: 'Do I need a Kaspa full node?',
    a: <>No. Only Node.js 20+, stable internet, and a Kaspa wallet for enroll.</>,
  },
  {
    id: 'secrets',
    q: 'Is my node secret safe?',
    a: (
      <>
        Keep <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">hmacSecret</code> in{' '}
        <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">config.json</code> only (never git). Rotate in the Hub if leaked.
      </>
    ),
  },
] as const;

export function KrexNodeFaqGuide() {
  return (
    <div className="space-y-6 w-full min-w-0" id="krex-node-faq">
      <div className={NODES_DASH_CARD}>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Frequently asked questions</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          Plain answers about Light, Edge, and Super nodes, HTTPS enrollment, and rewards. Also on the{' '}
          <Link href="/knowledge-base/krex-node-faq" className="text-cyan-700 dark:text-cyan-300 font-semibold hover:underline">
            Knowledge Base
          </Link>
          .
        </p>
        <dl className="space-y-6">
          {FAQ.map((item) => (
            <div key={item.id} id={`faq-${item.id}`} className="border-b border-zinc-100 dark:border-zinc-800 pb-6 last:border-0 last:pb-0">
              <dt className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">{item.q}</dt>
              <dd className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.a}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-wrap gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Link
            href="/nodes?tab=setup"
            scroll={false}
            className="inline-flex px-4 py-2.5 rounded-xl bg-[#02abb8] hover:bg-[#02919c] text-white font-bold text-sm"
          >
            Setup guide
          </Link>
          <Link
            href="/nodes?tab=enroll"
            scroll={false}
            className="inline-flex px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 font-semibold text-sm"
          >
            Enroll
          </Link>
        </div>
      </div>
    </div>
  );
}

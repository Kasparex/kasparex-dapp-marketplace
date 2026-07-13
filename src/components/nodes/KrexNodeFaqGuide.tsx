'use client';

import Link from 'next/link';
import { NODES_DASH_CARD } from './nodesTabLayout';
import { KREX_NODE_PACKAGE_GITHUB } from '@/lib/nodes/operator-links';

const FAQ = [
  {
    id: 'what-is-it',
    q: 'What is a KREX Node?',
    a: (
      <>
        A small program on <strong>your</strong> computer or VPS. It is <strong>not</strong> a Kaspa BlockDAG full node. It
        sends &quot;I am online&quot; pings to Kasparex, can store Hub files locally, and (mirror role) can serve public
        read-only web pages.
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
        <strong>No</strong> to enroll, earn points, and run on your PC (<code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">localhost:8788</code> is fine).
        <br />
        <strong>Yes</strong> only if you want to be a <strong>public helper</strong> so other Hub users&apos; browsers can use your mirror (HTTPS URL).
      </>
    ),
  },
  {
    id: 'public-helper',
    q: 'What is a &quot;public helper&quot;?',
    a: (
      <>
        When your node has a <strong>public HTTPS address</strong>, the Kasparex website can send some <strong>read-only</strong>{' '}
        requests to you (wallet deck, token lookups, cached images, etc.) instead of always hitting the central server.
        You help <strong>visitors browsing Kasparex</strong>. You do <strong>not</strong> run other people&apos;s nodes for them.
      </>
    ),
  },
  {
    id: 'share-url',
    q: 'Can many operators share one public URL?',
    a: (
      <>
        <strong>No.</strong> Each operator enrolls their own wallet, runs their own software, and registers their own URL (or localhost).
        One person&apos;s public URL is only their machine.
      </>
    ),
  },
  {
    id: 'node-down',
    q: 'If my public node goes offline, does it break Kasparex?',
    a: (
      <>
        <strong>No.</strong> The Hub tries other operator mirrors, then falls back to the central API. Your node going offline only
        means you stop helping until you are back. Other operators and the main site keep working.
      </>
    ),
  },
  {
    id: 'more-nodes',
    q: 'Are more public nodes better?',
    a: (
      <>
        <strong>Yes.</strong> More healthy public mirrors spread read traffic, reduce load on central servers, and add backup paths.
        One local-only node helps you learn and earn operator points; many public nodes help <strong>everyone&apos;s</strong> experience and costs.
      </>
    ),
  },
  {
    id: 'local-benefit',
    q: 'Does running locally (no public URL) help Kasparex?',
    a: (
      <>
        <strong>A little, not much.</strong> Local nodes still ping the registry, can warm pin files, and prove the operator network is
        growing. They do <strong>not</strong> offload website traffic for other users (browsers cannot reach your localhost).
        <br />
        <br />
        <strong>Today:</strong> local operators still earn Hub Points (enroll bonus + qualified online days) to encourage people to start.
        <br />
        <strong>Future policy may change:</strong> we may reward <strong>public mirrors</strong> more than localhost-only, because they are the real infrastructure helpers. Public URL would not be required to participate, but would earn the full &quot;helper&quot; tier.
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
        <strong>Running a node</strong> = operator job on your PC (separate program, Enroll tab, config.json). Another person setting up
        their node does <strong>not</strong> use your URL; they run their own copy of the software.
      </>
    ),
  },
  {
    id: 'rewards',
    q: 'What do operators earn?',
    a: (
      <>
        <strong>Hub Points</strong> on your enrolled Kaspa wallet: +1,000 on enroll, +250 base per qualified online day (× KREX tier).
        Redeem on the Rewards catalog. No GRID or fee discounts on the Nodes dashboard today.
      </>
    ),
  },
  {
    id: 'nft-future',
    q: 'Will operator NFTs / gamification exist?',
    a: (
      <>
        <strong>Not live today.</strong> A future idea: connect a KRC721 &quot;operator badge&quot; NFT on the Nodes page for cosmetic flair
        and a <strong>small, capped</strong> bonus (e.g. extra multiplier or daily cap). Would require on-chain ownership checks and
        careful limits so it stays fair and cheap to run. Sensible as a later phase, not required to operate a node.
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
        <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">config.json</code> only (never git). It proves heartbeats
        from your machine. Rotate in the Hub if leaked. The node never holds your wallet private keys.
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
          Plain answers about running a node, domains, helping others, and rewards. Also on the{' '}
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

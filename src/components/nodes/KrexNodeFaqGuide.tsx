'use client';

import Link from 'next/link';
import { NODES_DASH_CARD } from './nodesTabLayout';
import { CopyableCommandBlock } from './CopyableCommandBlock';
import { GuideTerm, GuideTipBox } from './NodeGuideUi';
import { KREX_NODE_PACKAGE_GITHUB } from '@/lib/nodes/operator-links';
import { dailyPtsLabel, enrollPtsLabel } from '@/lib/nodes/node-role';

const QUICK_TUNNEL_WIN = '"C:\\Program Files (x86)\\cloudflared\\cloudflared.exe" tunnel --url http://127.0.0.1:8788';
const QUICK_TUNNEL_UNIX = 'cloudflared tunnel --url http://127.0.0.1:8788';

const FAQ = [
  {
    id: 'what-is-it',
    q: 'What is a KREX Node, in plain words?',
    a: (
      <>
        <p className="mb-2">
          A small program on <strong>your computer</strong> that says &quot;I am online&quot; to Kasparex.
        </p>
        <p>
          It is <strong>not</strong> a Kaspa miner or full blockchain node. Edge nodes also share a{' '}
          <GuideTerm tip="A web address starting with https:// that anyone can open.">public link</GuideTerm> so other
          visitors load Hub data faster.
        </p>
      </>
    ),
  },
  {
    id: 'run-vs-visit',
    q: 'Is this the same as just using the website?',
    a: (
      <>
        <strong>No.</strong> Browsing Kasparex = normal user.
        <br />
        Running a node = operator mode. You install software, enroll your wallet, and keep a small app online.
      </>
    ),
  },
  {
    id: 'rewards',
    q: 'What do I earn?',
    a: (
      <>
        <GuideTipBox variant="success">
          <strong>Hub Points</strong> on your enrolled wallet. Redeem on Rewards.
          <br />
          Enroll bonus: {enrollPtsLabel()}.
          <br />
          Each qualified online day: {dailyPtsLabel()} base (× your KREX tier).
        </GuideTipBox>
      </>
    ),
  },
  {
    id: 'node-types',
    q: 'Light, Edge, or Super?',
    a: (
      <ul className="space-y-2 text-sm list-none pl-0">
        <li>
          <strong>Light:</strong> easiest. No public link. Lower rewards.
        </li>
        <li>
          <strong>Edge:</strong> recommended. Public link required. Helps other users more.
        </li>
        <li>
          <strong>Super:</strong> highest rewards. Same public link rule. Hub wiring coming soon.
        </li>
      </ul>
    ),
  },
  {
    id: 'get-url',
    q: 'How do I get a public link for Edge?',
    a: (
      <>
        <p className="mb-3 text-sm">
          The website does <strong>not</strong> make the link for you. You run a free tool on your PC called cloudflared.
        </p>
        <GuideTipBox variant="tip" title="Fastest way (free)">
          <ol className="list-decimal pl-4 space-y-1 text-xs">
            <li>Terminal 1: <code className="bg-white/50 dark:bg-black/20 px-1 rounded">npm run edge</code></li>
            <li>Terminal 2: copy a command below</li>
            <li>Copy the printed <code className="bg-white/50 dark:bg-black/20 px-1 rounded">https://….trycloudflare.com</code></li>
            <li>Paste into Enroll and config.json</li>
          </ol>
        </GuideTipBox>
        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-4 mb-1">Windows</p>
        <CopyableCommandBlock command={QUICK_TUNNEL_WIN} />
        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-3 mb-1">Mac / Linux</p>
        <CopyableCommandBlock command={QUICK_TUNNEL_UNIX} />
      </>
    ),
  },
  {
    id: 'trycloudflare',
    q: 'Is trycloudflare.com free for everyone?',
    a: (
      <>
        <strong>Yes.</strong> Each operator gets their own random link. It is not created inside this website.
        <GuideTipBox variant="warn" title="Catch">
          The link changes when you restart cloudflared. Fine for testing. For a permanent link, use your own subdomain (Setup Path B).
        </GuideTipBox>
      </>
    ),
  },
  {
    id: 'domain',
    q: 'Do I need to buy a domain?',
    a: (
      <>
        <strong>Light:</strong> no.
        <br />
        <strong>Edge testing:</strong> no purchase. Use trycloudflare.
        <br />
        <strong>Edge long term:</strong> your own link (e.g. edge.yourdomain.com) is more stable.
      </>
    ),
  },
  {
    id: 'wix-cloudflare',
    q: 'I use Wix for kasparex.com. Can I use edge.kasparex.com?',
    a: (
      <>
        <p className="mb-2">
          A DNS record in Wix alone is <strong>not enough</strong> for a stable Edge link today.
        </p>
        <GuideTipBox variant="info">
          <strong>Two options:</strong>
          <br />
          1) Use a free trycloudflare link now (easiest).
          <br />
          2) Move domain DNS to Cloudflare later for a stable edge.kasparex.com. Your Wix site can stay online if you copy the same DNS records.
        </GuideTipBox>
        <GuideTipBox variant="warn" title="Transfer domain?">
          Moving registration from Wix to Cloudflare changes who you pay for the domain and where you edit DNS. It does{' '}
          <strong>not</strong> delete your Wix website. You can still point kasparex.com to Wix from Cloudflare DNS.
        </GuideTipBox>
      </>
    ),
  },
  {
    id: 'url-mismatch',
    q: 'Hub shows a different link than my tunnel',
    a: (
      <>
        The dashboard shows what you typed at <strong>enroll</strong>. Changed your tunnel? Update the link in the Hub and in{' '}
        <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">config.json</code> so they match.
      </>
    ),
  },
  {
    id: 'local-vs-enroll',
    q: 'Can I test before enrolling?',
    a: (
      <>
        <strong>Yes.</strong> Run the app and open <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">localhost:8788/health</code> on
        your PC only. Do <strong>not</strong> enroll with localhost. Get a public link first.
      </>
    ),
  },
  {
    id: 'wrong-repo',
    q: 'Where do I download the software?',
    a: (
      <>
        Use <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">packages/krex-node</code> inside{' '}
        <a href={KREX_NODE_PACKAGE_GITHUB} className="text-cyan-700 dark:text-cyan-300 font-semibold hover:underline" target="_blank" rel="noreferrer">
          kasparex-dapp-marketplace
        </a>
        . Copy-paste commands are on the Setup tab.
      </>
    ),
  },
  {
    id: 'public-helper',
    q: 'What does "help other users" mean?',
    a: (
      <>
        Your Edge node can answer simple <strong>read-only</strong> requests (wallet lookups, cached images, stats). If you go offline, the Hub uses
        another node or the central server. Nothing breaks.
      </>
    ),
  },
  {
    id: 'share-url',
    q: 'Can we share one public link?',
    a: <>No. Each operator runs their own software and enrolls their own link.</>,
  },
  {
    id: 'node-down',
    q: 'If my node goes offline, does Kasparex break?',
    a: <>No. The Hub falls back automatically.</>,
  },
  {
    id: 'need-kaspa-node',
    q: 'Do I need a Kaspa full node?',
    a: <>No. You need Node.js 20+, internet, and a Kaspa wallet for enroll.</>,
  },
  {
    id: 'secrets',
    q: 'How do I keep my secret safe?',
    a: (
      <>
        Keep <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">hmacSecret</code> in{' '}
        <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">config.json</code> on your PC only. Never commit it to git. Rotate in the Hub if leaked.
      </>
    ),
  },
  {
    id: 'nft-future',
    q: 'Operator NFTs?',
    a: <>Not live today. Possible cosmetic extras later. Not required to run a node.</>,
  },
] as const;

export function KrexNodeFaqGuide() {
  return (
    <div className="space-y-6 w-full min-w-0" id="krex-node-faq">
      <div className={NODES_DASH_CARD}>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">FAQ</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Short answers for new operators. Hover <span className="border-b border-dotted border-zinc-400">underlined words</span> for extra detail.
        </p>
        <GuideTipBox variant="tip">
          First time? Read the <Link href="/nodes?tab=setup" scroll={false} className="font-bold underline">Setup tab</Link> first, then come back here if you are stuck.
        </GuideTipBox>
        <dl className="space-y-6 mt-6">
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

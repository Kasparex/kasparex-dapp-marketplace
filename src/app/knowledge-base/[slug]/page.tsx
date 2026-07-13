import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TableOfContentsSidebar } from '@/components/docs/TableOfContentsSidebar';
import { getArticleBySlug, knowledgeBaseArticles } from '@/lib/knowledgeBase';
import Link from 'next/link';
import { buildHubOpenGraphMetadata } from '@/lib/metadata/hubSocialPreview';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return knowledgeBaseArticles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return buildHubOpenGraphMetadata({
      title: 'Article Not Found - Kasparex Knowledge Base',
      path: `/knowledge-base/${slug}`,
    });
  }

  return buildHubOpenGraphMetadata({
    title: `${article.title} - Kasparex Knowledge Base`,
    description: article.description,
    path: `/knowledge-base/${slug}`,
    type: 'article',
  });
}

// Article content mapping
const articleContent: Record<string, { sections: Array<{ id: string; title: string; content: string }> }> = {
  'what-is-kasparex': {
    sections: [
      {
        id: 'introduction',
        title: 'Introduction',
        content: 'Kasparex is a decentralized dApp marketplace built on Kaspa BlockDAG. It provides a platform for developers to deploy, share, and monetize their decentralized applications while offering users a seamless way to discover and interact with dApps.',
      },
      {
        id: 'features',
        title: 'Key Features',
        content: 'The marketplace includes features like dApp discovery, wallet integration, reward systems, and community-driven curation. Users can browse dApps by category, filter by network compatibility, and interact with dApps directly from the marketplace.',
      },
      {
        id: 'ecosystem',
        title: 'The Ecosystem',
        content: 'Kasparex is more than just a marketplace. It includes KREX Nodes for decentralized hosting, the Kasparex API for coordination, GRID (Global Reward Token) across L2 activity, and Hub redeemable pts on Kaspa tracked from /rewards.',
      },
    ],
  },
  'krex-node-overview': {
    sections: [
      {
        id: 'what-are-krex-nodes',
        title: 'What are KREX Nodes?',
        content:
          'KREX Nodes are small helper programs you run on your PC or VPS. They are NOT Kaspa BlockDAG nodes. They send signed heartbeats to Kasparex, can warm Hub IPFS files locally, and (Edge role) expose a public HTTPS read API. Software: packages/krex-node in kasparex-dapp-marketplace.',
      },
      {
        id: 'benefits',
        title: 'Why run one?',
        content:
          'Earn Hub Points on your Kaspa wallet: 500 Light / 700 Edge / 1,000 Super on enroll; 100 / 250 / 500 base per qualified online day (× KREX tier). Edge nodes with public HTTPS help other Hub users via node-first routing.',
      },
      {
        id: 'node-types',
        title: 'Node types',
        content:
          'Light: heartbeats + pin cache, no public HTTP. Edge (recommended): Light + public HTTPS read API (required at enroll). Super: higher capacity when enabled.',
      },
      {
        id: 'domain',
        title: 'Do I need a domain?',
        content:
          'Light: no domain. Edge/Super: yes, public HTTPS URL required at enrollment. Test on localhost:8788 before exposing HTTPS.',
      },
    ],
  },
  'krex-node-setup': {
    sections: [
      {
        id: 'prerequisites',
        title: 'What you need',
        content:
          'Node.js 20+, a Kaspa wallet (for Hub enroll), and a machine that can stay online. Optional: PM2 for background running. You do NOT need a Kaspa full node, special hardware, or a domain to get started.',
      },
      {
        id: 'installation',
        title: 'Install (correct repo)',
        content:
          '1. git clone marketplace repo\n2. cd packages/krex-node\n3. npm install && npm run build\n4. npm run edge — test localhost:8788/health\n5. Expose HTTPS (tunnel or VPS)\n6. Enroll on Hub with role Edge + HTTPS URL\n7. cp config.example.json config.json — set nodeId, hmacSecret, role edge, url\n8. pm2 start ecosystem.config.cjs',
      },
      {
        id: 'configuration',
        title: 'Key config fields',
        content:
          'role: light | edge | super\nurl: public HTTPS for edge/super; optional for light\nnodeId + hmacSecret: from Hub enroll',
      },
    ],
  },
  'krex-node-faq': {
    sections: [
      {
        id: 'what-is-krex-node',
        title: 'What is a KREX Node?',
        content:
          'Small program on your PC or VPS. Not a Kaspa BlockDAG node. Light = heartbeats + pins. Edge = public HTTPS helper (recommended). Software: packages/krex-node in kasparex-dapp-marketplace.',
      },
      {
        id: 'domain-required',
        title: 'Do I need a domain?',
        content:
          'Light: no. Edge/Super: yes (public HTTPS at enroll). Local testing on localhost does not get registered in the Hub.',
      },
      {
        id: 'edge-https',
        title: 'Edge nodes and HTTPS',
        content:
          'Edge enrollment requires a public HTTPS URL. Run npm run edge locally to learn, then add Cloudflare Tunnel or VPS HTTPS before enrolling. Light nodes do not need a public URL.',
      },
      {
        id: 'public-helper',
        title: 'What is a public helper?',
        content:
          'A node with a public HTTPS URL that answers some read-only Hub requests (wallet reads, proxies, pinned IPFS) so the central Kasparex server does less work. You help people browsing the website. You do not run their node software or hold their keys.',
      },
      {
        id: 'one-url-many',
        title: 'Can operators share one URL?',
        content:
          'No. Each operator has their own enrollment, secret, and URL. Person A public mirror is only Person A machine.',
      },
      {
        id: 'node-offline',
        title: 'If a public node goes offline?',
        content:
          'The Hub tries other mirrors, then the central API. One node stopping does not break Kasparex for everyone.',
      },
      {
        id: 'more-public',
        title: 'More public nodes = better?',
        content:
          'Yes. More healthy public mirrors spread traffic and reduce central costs. Local-only nodes help the operator network grow but do not offload traffic for other users.',
      },
      {
        id: 'local-vs-public',
        title: 'Does localhost help Kasparex? Should it earn points?',
        content:
          'Local helps a little (heartbeats, pin cache, onboarding) but not much for site costs because browsers cannot use localhost on your PC. Today: local operators still earn Hub Points to encourage setup. Future policy may pay public mirrors more than localhost-only, since public mirrors are the real infrastructure helpers. Public URL would stay optional.',
      },
      {
        id: 'run-vs-visit',
        title: 'Running a node vs using the website',
        content:
          'Using Kasparex = visitor. Running a node = separate operator job on your machine. Someone enrolling their node does not use your URL; they clone packages/krex-node and run their own process.',
      },
      {
        id: 'rewards-summary',
        title: 'Operator rewards today',
        content:
          'Hub Points: 500/700/1,000 enroll by tier; 100/250/500 base per qualified day (× KREX tier). Redeem on Rewards catalog.',
      },
      {
        id: 'operator-nft-future',
        title: 'Operator NFTs / gamification (future)',
        content:
          'Not live today. Possible later: KRC721 operator badge slot on Nodes page, cosmetic plus small capped bonus (multiplier or daily cap). Needs L1 ownership verify and strict limits. Nice for engagement if kept simple; not required to run a node.',
      },
    ],
  },
  'krex-node-rewards': {
    sections: [
      {
        id: 'reward-types',
        title: 'Hub Points (operators)',
        content:
          'Operators earn server-side Hub Points on enrolled wallet. Enroll: 500 Light, 700 Edge, 1,000 Super. Daily: 100/250/500 base per qualified UTC day (× KREX tier). Redeem on Rewards catalog.',
      },
      {
        id: 'reward-calculation',
        title: 'Qualified day',
        content:
          'The Worker cron credits points when your node stays online enough in a UTC day (heartbeats + uptime rules). Keep PM2 or your process running; sleep or shutdown pauses rewards until you are back.',
      },
      {
        id: 'multipliers',
        title: 'KREX tier multiplier',
        content:
          'Same Hub Points multipliers as the rest of Kasparex: higher KREX holdings increase daily operator pts (e.g. 10M+ KREX = 2x on the +250 base). Tier is read from your L1 KREX balance at settlement time.',
      },
    ],
  },
  'api-overview': {
    sections: [
      {
        id: 'what-is-api',
        title: 'What is the Kasparex API?',
        content: 'The Kasparex API is a lightweight backend service that coordinates KREX Nodes, tracks uptime and performance, calculates rewards, and provides public data for the Kasparex frontend and ecosystem.',
      },
      {
        id: 'role',
        title: 'Role in the Ecosystem',
        content: 'Think of KREX Nodes as the body (they pin and mirror data) and the Kasparex API as the brain (it tracks, scores, and coordinates them). The API does NOT replace Kaspa BlockDAG, Storacha, or IPFS - it simply manages the node network.',
      },
      {
        id: 'endpoints',
        title: 'Main Endpoints',
        content: 'The API provides endpoints for node management (/api/node/*), reward calculations (/api/rewards/*), and public data (/api/dapps/*, /api/stats). All endpoints are documented at /api.',
      },
    ],
  },
  'api-endpoints': {
    sections: [
      {
        id: 'node-management',
        title: 'Node Management Endpoints',
        content: 'POST /api/node/register - Register a new KREX Node\nPOST /api/node/ping - Send heartbeat pings (every 60 seconds)\nGET /api/nodes - Get list of active nodes',
      },
      {
        id: 'reward-endpoints',
        title: 'Reward Engine Endpoints',
        content: 'GET /api/rewards/node/:nodeId - Get rewards for a specific node\nGET /api/rewards/epoch/:epochId - Get summary of rewards for an epoch',
      },
      {
        id: 'public-endpoints',
        title: 'Public Data Endpoints',
        content: 'GET /api/dapps/availability - Get which nodes mirror which dApps\nGET /api/stats - Get general network statistics',
      },
    ],
  },
  'grid-token': {
    sections: [
      {
        id: 'what-is-grid',
        title: 'What is GRID?',
        content: 'GRID (Global Reward Token) has a fixed supply of 10B on Kaspa L1. L2 deployments are operational layers used for rewards and utility across Kasparex dApps. GRID is earned through activity like using dApps and participating in the ecosystem.',
      },
      {
        id: 'uses',
        title: 'Uses of GRID',
        content: 'GRID tokens can be used for governance, staking, accessing premium features, and as a base reward for ecosystem participation. The tokenomics and distribution are designed to incentivize long-term ecosystem growth.',
      },
      {
        id: 'earning',
        title: 'How to Earn GRID',
        content: 'You can earn GRID by running KREX Nodes, using dApps, completing actions, and participating in community activities. KREX holders get multipliers on GRID earnings.',
      },
    ],
  },
  'lrt-tokens': {
    sections: [
      {
        id: 'what-is-grid',
        title: 'What is GRID?',
        content: 'GRID (Global Reward Token) is the single reward token for the Kasparex ecosystem. You earn GRID by using any dApp, running KREX Nodes, and participating in the network. There are no per-dApp tokens.',
      },
      {
        id: 'how-to-earn',
        title: 'How to Earn GRID',
        content: 'Use dApps, run a KREX Node, complete actions, and participate in community activities. All actions reward GRID. Holding KREX and NFTs multiplies your GRID earnings.',
      },
      {
        id: 'hub-pts',
        title: 'Hub redeemable pts',
        content: 'Alongside GRID, Kaspa-connected flows record redeemable pts on /rewards for publishes, listings, campaigns, qualified dApps, catalog spends, and more. Ledger stays device-local until server mirror launches.',
      },
    ],
  },
  'krex-multipliers': {
    sections: [
      {
        id: 'tier-system',
        title: 'KREX Tier System',
        content: 'KREX holders are organized into tiers based on their holdings. Higher tiers provide larger multipliers on GRID rewards. The tiers range from 1.0x (0 KREX) to 1.5x (10M+ KREX).',
      },
      {
        id: 'tier-levels',
        title: 'Tier Levels',
        content: 'Tier 0: 0 KREX (1.0x)\nTier 1: 100k KREX (1.05x)\nTier 2: 500k KREX (1.1x)\nTier 3: 1M KREX (1.2x)\nTier 4: 5M KREX (1.3x)\nTier 5: 10M+ KREX (1.5x)',
      },
      {
        id: 'applies-to',
        title: 'What Gets Multiplied?',
        content: 'KREX multipliers apply to GRID rewards. Holding KREX increases your earnings across the entire ecosystem, making it beneficial for both users and node operators.',
      },
    ],
  },
  'blockdag-explained': {
    sections: [
      {
        id: 'what-is-blockdag',
        title: 'What is a BlockDAG?',
        content: 'A BlockDAG (Block Directed Acyclic Graph) is Kaspa\'s unique consensus mechanism. Unlike traditional blockchains that use a linear chain, BlockDAG allows multiple blocks to be created in parallel, dramatically increasing throughput.',
      },
      {
        id: 'vs-blockchain',
        title: 'BlockDAG vs Blockchain',
        content: 'Traditional blockchains process transactions sequentially, creating bottlenecks. BlockDAG processes many blocks simultaneously, allowing for much higher transaction throughput while maintaining security through the DAG structure.',
      },
      {
        id: 'kaspa-implementation',
        title: 'Kaspa\'s Implementation',
        content: 'Kaspa uses the GHOSTDAG protocol, which allows for parallel block creation while maintaining consensus. This makes Kaspa one of the fastest and most scalable cryptocurrency networks, capable of handling high transaction volumes.',
      },
    ],
  },
  'vprogs-explained': {
    sections: [
      {
        id: 'what-are-vprogs',
        title: 'What are Verifiable Programs?',
        content: 'Verifiable Programs (vProgs) are Kaspa\'s approach to smart contracts. Unlike traditional smart contracts that execute on-chain, vProgs execute off-chain and submit cryptographic proofs to the BlockDAG for verification.',
      },
      {
        id: 'how-they-work',
        title: 'How vProgs Work',
        content: 'vProgs run complex logic off-chain, generate verifiable proofs of correctness, and submit these proofs to Kaspa\'s Layer 1. The BlockDAG verifies the proofs rather than executing the full computation, making it highly scalable.',
      },
      {
        id: 'benefits',
        title: 'Benefits',
        content: 'vProgs offer scalability (off-chain execution), lower costs (only proofs are submitted), faster execution (no on-chain computation delays), and native integration with Kaspa\'s BlockDAG architecture.',
      },
    ],
  },
  'kpx-v1-overview': {
    sections: [
      {
        id: 'what-is-kpx',
        title: 'What is kpx?',
        content:
          'kpx is a Kaspa-wide, app-agnostic payload standard for wallet-owned records. Kasparex ships a reference implementation and UI, but the format is designed so other indexers can implement it too.',
      },
      {
        id: 'mental-model',
        title: 'Mental model',
        content:
          'Protocol spec = the rules\\nWriter = code that creates the transaction payload\\nReader = code that scans + interprets payloads\\nUI = what users see (Profile Hub, Creator Hub, etc.)',
      },
      {
        id: 'v1-types',
        title: 'kpx v1 types',
        content:
          'kpx/pf: profile (display, bio, tags)\\nkpx/ver: verified badge (boolean)\\nkpx/lnk: Kaspa ↔ EVM link (hybrid auth)\\nkpx/cm: commits for creator-owned resources (rt/rid/ch/sv)',
      },
      {
        id: 'determinism',
        title: 'Determinism rules',
        content:
          'Records are valid when payer == addr (normalized). For any (net, addr, t), the highest seq wins. If seq ties exist, highest block height wins, then txid.',
      },
    ],
  },
  'kpx-v1-verified-badge': {
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        content:
          'kpx/ver v1 is a minimal verified badge record. It is deterministic and preset-free in v1: it is simply a boolean badge derived from the highest-seq record.',
      },
      {
        id: 'shape',
        title: 'Record shape',
        content:
          'Top-level envelope fields only: p,t,v,net,op,addr,seq. No data. op:set adds the badge, op:clear removes it.',
      },
      {
        id: 'policy',
        title: 'Kasparex policy vs protocol validity',
        content:
          'The protocol only defines how the badge is written and resolved. Kasparex may define what qualifies as “verified” in its own policy and tooling in v1.',
      },
    ],
  },
  'kpx-v1-linking': {
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        content:
          'kpx/lnk v1 links a Kaspa principal to an EVM address to support hybrid authentication. Kaspa remains the canonical identity for ownership and commit payments.',
      },
      {
        id: 'rules',
        title: 'Rules',
        content:
          'The record is wallet-owned (payer == addr). The highest seq wins. op:set stores the evm address, op:clear removes it.',
      },
    ],
  },
  'kpx-v1-commits': {
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        content:
          'kpx/cm v1 is a global commit pointer for creator-owned resources. It standardizes how a resource is referenced and how a canonical update is finalized on-chain.',
      },
      {
        id: 'fields',
        title: 'Fields (v1)',
        content:
          'data.rt (type code), data.rid (resource id), data.ch (content hash, 64 hex), data.sv (schema version). op:create for first publish, op:edit for canonical updates.',
      },
      {
        id: 'fees',
        title: 'Fees (Kasparex reference policy)',
        content:
          'Drafts are free. Public canonical commits require a paid Kaspa transaction. The platform may enforce minimums and size-based fees, and apply KREX tier discounts (Kasparex-enforced in v1).',
      },
    ],
  },
  'node-troubleshooting': {
    sections: [
      {
        id: 'common-issues',
        title: 'Common Issues',
        content: 'Common issues include: node not connecting to API, sync failures, high resource usage, and reward calculation problems. Most issues can be resolved by checking logs, verifying configuration, and ensuring stable internet connection.',
      },
      {
        id: 'connection-issues',
        title: 'Connection Issues',
        content: 'If your node cannot connect to the Kasparex API, check: firewall settings, network connectivity, API endpoint configuration, and ensure the API is accessible from your location.',
      },
      {
        id: 'resource-usage',
        title: 'High Resource Usage',
        content: 'KREX Nodes should use minimal resources (0.2% CPU, 30-60MB RAM). If you see higher usage, check for multiple instances running, verify you\'re not running a full Kaspa node by mistake, and ensure no other heavy processes are running.',
      },
    ],
  },
  'api-troubleshooting': {
    sections: [
      {
        id: 'connection-problems',
        title: 'API Connection Problems',
        content: 'If you cannot connect to the Kasparex API, verify the endpoint URL is correct, check your network connection, ensure no firewall is blocking the connection, and verify the API service is operational.',
      },
      {
        id: 'timeout-issues',
        title: 'Timeout Issues',
        content: 'If requests are timing out, check your network latency, verify the API server is not overloaded, and consider using a mirror node if available. You can also check the /api/stats endpoint for network health.',
      },
      {
        id: 'authentication',
        title: 'Authentication Issues',
        content: 'Most API endpoints are public and don\'t require authentication. Node registration and pings require a valid node ID. If you\'re having authentication issues, verify your node is properly registered.',
      },
    ],
  },
  'advanced-node-config': {
    sections: [
      {
        id: 'advanced-settings',
        title: 'Advanced Settings',
        content: 'Advanced configuration options include: custom IPFS gateways, Storacha node selection, custom sync intervals, API endpoint overrides, logging levels, and resource limits.',
      },
      {
        id: 'performance-tuning',
        title: 'Performance Tuning',
        content: 'For optimal performance, you can adjust: pinning strategies, cache sizes, sync frequencies, and API request batching. These settings depend on your hardware and network capabilities.',
      },
      {
        id: 'monitoring',
        title: 'Monitoring and Logging',
        content: 'Advanced users can set up monitoring for node health, uptime tracking, reward calculations, and performance metrics. Logs can be configured for different verbosity levels.',
      },
    ],
  },
  'ipfs-storacha': {
    sections: [
      {
        id: 'what-is-ipfs',
        title: 'What is IPFS?',
        content: 'IPFS (InterPlanetary File System) is a distributed file storage system. In Kasparex, IPFS is used to store dApp files, metadata, and static assets in a decentralized, censorship-resistant manner.',
      },
      {
        id: 'what-is-storacha',
        title: 'What is Storacha?',
        content: 'Storacha is a decentralized storage solution built on Kaspa. It provides fast, reliable storage for Kasparex dApps and integrates natively with the Kaspa ecosystem.',
      },
      {
        id: 'how-they-work',
        title: 'How They Work Together',
        content: 'KREX Nodes pin files to both IPFS and Storacha, ensuring redundancy and availability. The Kasparex frontend prioritizes Storacha, then IPFS, then KREX Node mirrors, and finally Vercel as a fallback.',
      },
    ],
  },
};

export default async function KnowledgeBaseArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const content = articleContent[slug] || {
    sections: [
      {
        id: 'content',
        title: article.title,
        content: `This article is coming soon. Check back later for detailed information about ${article.title}.`,
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col lg:flex-row">
        <TableOfContentsSidebar
          storageKeyPrefix={`kb-${slug}`}
          backHref="/knowledge-base"
          backLabel="Knowledge Base"
          showKnowledgeBaseLink={false}
          items={content.sections.map((section) => ({
            id: section.id,
            title: section.title,
          }))}
        />

        <div className="min-w-0 flex-1 overflow-y-auto border-l border-zinc-200 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 dark:border-zinc-800">
          <div className="mx-auto max-w-4xl">
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              <Link href="/knowledge-base" className="hover:text-[#02abb8]">
                Knowledge Base
              </Link>
              <span className="mx-2">/</span>
              <span className="text-zinc-900 dark:text-zinc-100">{article.title}</span>
            </nav>

            {/* Article Header */}
            <div className="mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                {article.title}
              </h1>
              <p className="kx-body">
                {article.description}
              </p>
            </div>

            {/* Article Content */}
            <div className="space-y-8">
              {content.sections.map((section) => (
                <section key={section.id} id={section.id} className="mb-12">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                    {section.title}
                  </h2>
                  <div className="kx-prose prose prose-zinc dark:prose-invert max-w-none">
                    <p className="whitespace-pre-line">
                      {section.content}
                    </p>
                  </div>
                </section>
              ))}
            </div>

            {/* Back to Knowledge Base */}
            <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <Link
                href="/knowledge-base"
                className="text-[#02abb8] hover:underline font-medium"
              >
                ← Back to Knowledge Base
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TableOfContentsSidebar } from '@/components/docs/TableOfContentsSidebar';
import { getArticleBySlug, knowledgeBaseArticles } from '@/lib/knowledgeBase';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return knowledgeBaseArticles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: `${article.title} · Knowledge Base`,
    description: article.description,
  };
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
        content: 'Kasparex is more than just a marketplace. It includes KREX Nodes for decentralized hosting, the Kasparex API for coordination, and a comprehensive reward system with GRID tokens and Local Reward Tokens (LRT).',
      },
    ],
  },
  'krex-node-overview': {
    sections: [
      {
        id: 'what-are-krex-nodes',
        title: 'What are KREX Nodes?',
        content: 'KREX Nodes are lightweight helper nodes that support the Kasparex network by pinning dApp files to IPFS/Storacha, caching metadata, and optionally serving as mirror nodes. They are NOT Kaspa BlockDAG nodes and require minimal resources.',
      },
      {
        id: 'benefits',
        title: 'Benefits of Running a KREX Node',
        content: 'Running a KREX Node helps reduce hosting costs for the Kasparex platform, increases decentralization and censorship resistance, and earns rewards for operators. Nodes can earn GRID tokens, Local Reward Tokens (LRT), and benefit from KREX multipliers.',
      },
      {
        id: 'node-types',
        title: 'Node Types',
        content: 'There are two types of KREX Nodes: Light Nodes (4x multiplier, 0.1% fee reduction) and Mirror Nodes (5x multiplier, 0.2% fee reduction). Mirror Nodes also expose a read-only HTTP API for serving cached data.',
      },
    ],
  },
  'krex-node-setup': {
    sections: [
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        content: 'To run a KREX Node, you need Node.js (LTS version) installed on your machine. The node can run on Windows, macOS, Linux, or even a Raspberry Pi. No special hardware is required.',
      },
      {
        id: 'installation',
        title: 'Installation Steps',
        content: '1. Install Node.js from nodejs.org\n2. Clone the repository: git clone https://github.com/Kasparex/kasparex-krex-node.git\n3. Install dependencies: npm install\n4. Start the node: npm start\n5. (Optional) Use pm2 for persistent running: pm2 start src/index.js --name krex-node',
      },
      {
        id: 'configuration',
        title: 'Configuration',
        content: 'The node can be configured via a config.json file. You can set options like pinning preferences, mirror mode, sync intervals, and API endpoints.',
      },
    ],
  },
  'krex-node-rewards': {
    sections: [
      {
        id: 'reward-types',
        title: 'Types of Rewards',
        content: 'KREX Node operators can earn two types of rewards: GRID (Global Reward Token) for overall network participation, and LRT (Local Reward Tokens) for serving specific dApps. Both are multiplied by your KREX holdings tier.',
      },
      {
        id: 'reward-calculation',
        title: 'How Rewards are Calculated',
        content: 'Rewards are calculated per epoch (typically daily) based on uptime, pinned files count, requests served (for Mirror Nodes), and your KREX tier multiplier. The system tracks your node\'s performance and distributes rewards accordingly.',
      },
      {
        id: 'multipliers',
        title: 'Multipliers',
        content: 'KREX holders get additional multipliers on all rewards. The multiplier ranges from 1.0x (0 KREX) to 1.5x (10M+ KREX). Mirror Nodes also get a 2x role multiplier compared to Light Nodes.',
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
        content: 'GRID (Global Reward Token) is the primary reward token in the Kasparex ecosystem. It is earned through various activities including running KREX Nodes, using dApps, and participating in the marketplace.',
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
        id: 'what-are-lrt',
        title: 'What are LRT Tokens?',
        content: 'Local Reward Tokens (LRT) are dApp-specific reward tokens. Each dApp can have its own LRT that is distributed to users and node operators who interact with or serve that specific dApp.',
      },
      {
        id: 'examples',
        title: 'Examples',
        content: 'For example, if you run a KREX Node that serves the Heatmap dApp, you might earn HEAT tokens. If you serve the Raffles dApp, you might earn RAFFLERT tokens. Each dApp defines its own LRT.',
      },
      {
        id: 'earning-lrt',
        title: 'Earning LRT',
        content: 'LRT tokens are earned proportionally to your participation with that specific dApp. KREX Node operators earn LRT based on requests served for each dApp. Users earn LRT through dApp interactions.',
      },
    ],
  },
  'krex-multipliers': {
    sections: [
      {
        id: 'tier-system',
        title: 'KREX Tier System',
        content: 'KREX holders are organized into tiers based on their holdings. Higher tiers provide larger multipliers on both GRID and LRT rewards. The tiers range from 1.0x (0 KREX) to 1.5x (10M+ KREX).',
      },
      {
        id: 'tier-levels',
        title: 'Tier Levels',
        content: 'Tier 0: 0 KREX (1.0x)\nTier 1: 100k KREX (1.05x)\nTier 2: 500k KREX (1.1x)\nTier 3: 1M KREX (1.2x)\nTier 4: 5M KREX (1.3x)\nTier 5: 10M+ KREX (1.5x)',
      },
      {
        id: 'applies-to',
        title: 'What Gets Multiplied?',
        content: 'KREX multipliers apply to both GRID rewards and all LRT rewards. This means holding KREX increases your earnings across the entire ecosystem, making it beneficial for both users and node operators.',
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
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="flex flex-col lg:flex-row">
          {/* Left Sidebar - Table of Contents */}
          <TableOfContentsSidebar
            items={content.sections.map((section) => ({
              id: section.id,
              title: section.title,
            }))}
          />
          
          {/* Main Content */}
          <div className="flex-1 min-w-0 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
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
                  <div className="prose prose-zinc dark:prose-invert max-w-none">
                    <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-line">
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


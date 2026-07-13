import Link from 'next/link';
import { NODES_DASH_CARD } from './nodesTabLayout';
import { KREX_NODE_PACKAGE_GITHUB } from '@/lib/nodes/operator-links';

const LINK_CLASS = 'text-cyan-700 dark:text-cyan-300 font-semibold hover:underline';

/**
 * Reference documentation for `/nodes` (Docs tab).
 */
export function KrexNodeDocsGuide() {
  return (
    <div className="space-y-6 w-full min-w-0">
      <section>
        <div className={`${NODES_DASH_CARD} space-y-3`}>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Documentation</h2>
          <p className="kx-body">
            Deep dives live in the knowledge base and repository. This tab is the stable entry point from the Nodes dashboard.
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/knowledge-base/krex-node-overview" scroll={false} className={LINK_CLASS}>
                KREX Nodes overview
              </Link>
            </li>
            <li>
              <Link href="/nodes?tab=faq" scroll={false} className={LINK_CLASS}>
                Nodes FAQ (on dashboard)
              </Link>
            </li>
            <li>
              <Link href="/knowledge-base/krex-node-faq" scroll={false} className={LINK_CLASS}>
                KREX Node FAQ (full)
              </Link>
            </li>
            <li>
              <Link href="/knowledge-base/krex-node-setup" scroll={false} className={LINK_CLASS}>
                Setup &amp; installation
              </Link>
            </li>
            <li>
              <Link href="/knowledge-base/krex-node-rewards" scroll={false} className={LINK_CLASS}>
                Rewards &amp; tiers
              </Link>
            </li>
            <li>
              <Link href="/api" scroll={false} className={LINK_CLASS}>
                Kasparex API overview
              </Link>{' '}
              <span className="text-zinc-500 dark:text-zinc-500">(Worker routes your node calls)</span>
            </li>
            <li>
              <a
                href={KREX_NODE_PACKAGE_GITHUB}
                className={LINK_CLASS}
                target="_blank"
                rel="noreferrer"
              >
                GitHub - packages/krex-node
              </a>
              <span className="text-zinc-500 dark:text-zinc-500"> (inside kasparex-dapp-marketplace)</span>
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className={`${NODES_DASH_CARD} space-y-3`}>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Endpoints operators care about</h2>
          <dl className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
            <div>
              <dt className="font-mono text-xs text-zinc-800 dark:text-zinc-200">GET /health</dt>
              <dd>Worker liveness for central fallback.</dd>
            </div>
            <div>
              <dt className="font-mono text-xs text-zinc-800 dark:text-zinc-200">GET /kasparex/stats</dt>
              <dd>Network counts and uptime-style aggregates (also used in premium diagnostics).</dd>
            </div>
            <div>
              <dt className="font-mono text-xs text-zinc-800 dark:text-zinc-200">POST /kasparex/node/*</dt>
              <dd>Enrollment, signed pings, and operator maintenance flows.</dd>
            </div>
          </dl>
        </div>
      </section>

      <section>
        <div className={`${NODES_DASH_CARD} space-y-3`}>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Environment &amp; safety</h2>
          <p className="kx-body">
            Keep <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">node_secret</code> off public repos. Rotate if
            exposed. Use HTTPS for edge node URLs when exposing a public API.
          </p>
        </div>
      </section>
    </div>
  );
}

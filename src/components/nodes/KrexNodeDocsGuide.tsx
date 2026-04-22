import Link from 'next/link';

const SECTION =
  'rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-3';

/**
 * Reference documentation for `/nodes` (Docs tab).
 */
export function KrexNodeDocsGuide() {
  return (
    <div className="space-y-6 max-w-4xl">
      <section className={SECTION}>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Documentation</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Deep dives live in the knowledge base and repository. This tab is the stable entry point from the Nodes dashboard.
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/knowledge-base/krex-node-overview" className="text-cyan-700 dark:text-cyan-300 font-semibold hover:underline">
              KREX Nodes overview
            </Link>
          </li>
          <li>
            <Link href="/knowledge-base/krex-node-setup" className="text-cyan-700 dark:text-cyan-300 font-semibold hover:underline">
              Setup &amp; installation
            </Link>
          </li>
          <li>
            <Link href="/knowledge-base/krex-node-rewards" className="text-cyan-700 dark:text-cyan-300 font-semibold hover:underline">
              Rewards &amp; tiers
            </Link>
          </li>
          <li>
            <Link href="/api" className="text-cyan-700 dark:text-cyan-300 font-semibold hover:underline">
              Kasparex API overview
            </Link>{' '}
            <span className="text-zinc-500 dark:text-zinc-500">(Worker routes your node calls)</span>
          </li>
          <li>
            <a
              href="https://github.com/Kasparex/kasparex-krex-node"
              className="text-cyan-700 dark:text-cyan-300 font-semibold hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              GitHub — kasparex-krex-node
            </a>
          </li>
        </ul>
      </section>

      <section className={SECTION}>
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
      </section>

      <section className={SECTION}>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Environment &amp; safety</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Keep <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">node_secret</code> off public repos. Rotate if
          exposed. Use HTTPS for mirror URLs when exposing a public API.
        </p>
      </section>
    </div>
  );
}

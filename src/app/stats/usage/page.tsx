import { Metadata } from 'next';
import { StatsPageShell } from '@/components/stats/StatsPageShell';
import { StatsHeader, statsHeadlineAccent, STATS_PANEL } from '@/components/stats/StatsHeader';
import { UsageMonitor } from '@/components/stats/UsageMonitor';

export const metadata: Metadata = {
  title: 'Usage Monitor · Kasparex Stats',
  description: 'Lightweight internal usage monitor for detecting request spikes.',
};

export default async function UsageMonitorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const secret = typeof sp.secret === 'string' ? sp.secret.trim() : '';
  const expected = process.env.INTERNAL_STATS_SECRET?.trim() ?? '';
  const authed = Boolean(expected) && secret === expected;

  return (
    <StatsPageShell>
      <StatsHeader
        badge="Internal Ops"
        headline={
          <>
            Usage {statsHeadlineAccent('Monitor')}
          </>
        }
        description="Sampled API counters for early spike detection. Protected with INTERNAL_STATS_SECRET."
      />

      {authed ? (
        <UsageMonitor />
      ) : (
        <section className={`${STATS_PANEL} p-6 sm:p-8`}>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Access required</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-xl">
            Append <span className="font-mono text-zinc-800 dark:text-zinc-200">?secret=…</span> to the URL and set{' '}
            <span className="font-mono text-zinc-800 dark:text-zinc-200">INTERNAL_STATS_SECRET</span> in the environment.
          </p>
        </section>
      )}
    </StatsPageShell>
  );
}

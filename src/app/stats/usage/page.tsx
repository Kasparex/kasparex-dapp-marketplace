import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StatsSidebar } from '@/components/stats/StatsSidebar';
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
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col lg:flex-row">
        <StatsSidebar />

        <div className="min-w-0 flex-1 overflow-y-auto border-l border-zinc-200 p-4 sm:p-6 lg:p-8 lg:pl-6 dark:border-zinc-800">
          <div className="mx-auto w-full max-w-6xl">
            {authed ? (
              <UsageMonitor />
            ) : (
              <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Usage Monitor</h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                  This page is protected. Append <span className="font-mono">?secret=…</span> to the URL and set
                  <span className="font-mono"> INTERNAL_STATS_SECRET</span> in the environment.
                </p>
              </section>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


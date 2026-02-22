'use client';

import { TreasuryBox } from '@/components/treasury/TreasuryBox';

/**
 * Kasparex Stats page content.
 * Currently shows Kasparex Treasury (TVL) section; real data can replace placeholders later.
 */
export function StatsPageContent() {
  return (
    <section className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <TreasuryBox showPerDApp />
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
        More stats and real-time data will be added in a future update.
      </p>
    </section>
  );
}

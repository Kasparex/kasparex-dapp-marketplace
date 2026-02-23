'use client';

import { TreasuryBox } from '@/components/treasury/TreasuryBox';

/**
 * Kasparex Stats page content.
 * Currently shows Kasparex Treasury (TVL) section; real data can replace placeholders later.
 */
export function StatsPageContent() {
  return (
    <section className="space-y-6">
      <TreasuryBox showPerDApp />
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
        More stats and real-time data will be added in a future update.
      </p>
    </section>
  );
}

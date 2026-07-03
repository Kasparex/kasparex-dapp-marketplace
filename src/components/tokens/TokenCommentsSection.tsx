'use client';

import Link from 'next/link';
import type { Token } from '@/lib/tokens/types';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { TOKEN_MODULE_OFFERS } from '@/lib/tokens/modules';
import { TOKENS_ACCENT } from '@/lib/tokens/theme';

export function TokenUtilitySection({ token }: { token: Token }) {
  if (!token.listing?.instantUtility && !token.listing?.verified) return null;

  return (
    <section id="token-utility" className="space-y-6">
      <DAppSectionHeader title="Utility & modules" />
      <p className="kx-body-sm">
        Extend this token page with roadmap editors, Hub integrations, analytics, and featured placement.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TOKEN_MODULE_OFFERS.map((module) => (
          <div
            key={module.id}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{module.title}</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{module.description}</p>
            <p className="mt-2 text-xs font-semibold text-[#02abb8]">{module.unlockPriceKas} KAS unlock</p>
          </div>
        ))}
      </div>
      <Link
        href="/tokens/dashboard"
        className="k-cta-primary inline-flex text-sm"
        style={{ borderColor: TOKENS_ACCENT }}
      >
        Open token editor
      </Link>
    </section>
  );
}

'use client';

import Link from 'next/link';
import type { Token } from '@/lib/tokens/types';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { resolveTokenUtilityProducts } from '@/lib/tokens/utilityRegistry';
import { canUseIntegrationUtility } from '@/lib/tokens/utilityEligibility';
import { TOKENS_ACCENT } from '@/lib/tokens/theme';

export function TokenHubUtilityPanel({ token }: { token: Token }) {
  if (!canUseIntegrationUtility(token)) return null;
  const products = resolveTokenUtilityProducts(token);
  if (products.length === 0) return null;

  return (
    <div className="space-y-4">
      <DAppSectionHeader title="Hub integrations" />
      <p className="kx-body-sm">
        This token is connected to Kasparex products. Community members can use it for payments, tips, and platform
        interactions.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {products.map((product) => (
          <Link
            key={product.id}
            href={product.href}
            className="group rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-cyan-500/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[#02abb8]">
                {product.label}
              </p>
              <span className="shrink-0 rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                {product.badge}
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{product.description}</p>
          </Link>
        ))}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Manage integrations from{' '}
        <Link href="/tokens/dashboard" className="font-semibold" style={{ color: TOKENS_ACCENT }}>
          your token dashboard
        </Link>
        .
      </p>
    </div>
  );
}

'use client';

import Link from 'next/link';
import type { Token } from '@/lib/tokens/types';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { HUB_UTILITY_PRODUCTS, getHubUtilityProduct, resolveTokenUtilityProducts } from '@/lib/tokens/utilityRegistry';
import { tokenHasModule } from '@/lib/tokens/modules';
import { resolveHubUtilityProductStatus } from '@/lib/tokens/integratedTokens';
import { TOKENS_ACCENT } from '@/lib/tokens/theme';

function statusMeta(status: ReturnType<typeof resolveHubUtilityProductStatus>): {
  label: string;
  className: string;
  detail?: string;
} {
  switch (status) {
    case 'live':
      return {
        label: 'Live',
        className: 'bg-[#02abb8]/15 text-[#02abb8] border-[#02abb8]/30',
      };
    case 'pending_verify':
      return {
        label: 'Pending verify',
        className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
        detail: 'Complete deployer verify to activate checkout.',
      };
    default:
      return {
        label: 'Coming soon',
        className: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20',
      };
  }
}

export function TokenHubUtilityPanel({ token }: { token: Token }) {
  const selectedIds = token.modulesConfig?.utilityProducts ?? [];
  const hasUtilityModule = tokenHasModule(token.paidModuleIds ?? [], 'utility_integrations');

  let products = resolveTokenUtilityProducts(token);
  if (products.length === 0) {
    if (selectedIds.length > 0) {
      products = selectedIds
        .map((id) => getHubUtilityProduct(id as (typeof selectedIds)[number]))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));
    } else if (hasUtilityModule || token.listing?.instantUtility) {
      products = token.listing?.instantUtility ? HUB_UTILITY_PRODUCTS.slice(0, 3) : HUB_UTILITY_PRODUCTS;
    }
  }

  if (products.length === 0) return null;
  const tick = token.symbol?.toUpperCase();

  return (
    <div className="space-y-4">
      <DAppSectionHeader title="Hub integrations" />
      <p className="kx-body-sm">
        Hub products linked to this token project. Status reflects your listing configuration (not live
        on-chain polling).
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {products.map((product) => {
          const status = resolveHubUtilityProductStatus(token, product.id);
          const meta = statusMeta(status);
          return (
            <Link
              key={product.id}
              href={product.href}
              className="group rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-[#02abb8]/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[#02abb8]">
                  {product.label}
                </p>
                <span
                  className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.className}`}
                >
                  {meta.label}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{product.description}</p>
              {status === 'live' && tick ? (
                <p className="mt-2 text-xs font-semibold text-[#02abb8]">Accepting ${tick}</p>
              ) : null}
              {meta.detail ? (
                <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">{meta.detail}</p>
              ) : null}
            </Link>
          );
        })}
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

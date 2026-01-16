/**
 * dApp Relation Section
 * Displays related dApps
 */

'use client';

import Link from 'next/link';
import type { Token } from '@/lib/tokens/types';
import { placeholderDApps } from '@/lib/dapps';
import { generateDAppSlug } from '@/lib/utils';
import { DAppIcon } from '@/components/dapps/DAppIcon';

interface DAppRelationSectionProps {
  token: Token;
}

export function DAppRelationSection({ token }: DAppRelationSectionProps) {
  const relatedDAppIds = token.relatedDAppIds || token.parentDAppId ? [token.parentDAppId!] : [];

  if (relatedDAppIds.length === 0) {
    return null;
  }

  const relatedDApps = placeholderDApps.filter((dapp) => relatedDAppIds.includes(dapp.id));

  if (relatedDApps.length === 0) {
    return null;
  }

  return (
    <section id="dapps" className="space-y-6">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Related dApps</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedDApps.map((dapp) => {
          const slug = dapp.slug || generateDAppSlug(dapp.name);
          return (
            <Link
              key={dapp.id}
              href={`/dapps/${slug}`}
              className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800 hover:border-[#02abb8] hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <DAppIcon
                  dAppName={dapp.name}
                  category={dapp.category}
                  size={40}
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {dapp.name}
                  </h3>
                </div>
              </div>
              {dapp.description && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {dapp.description}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

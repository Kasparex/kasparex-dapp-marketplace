import Image from 'next/image';
import Link from 'next/link';
import { DApp, type DAppStatus } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { generateDAppSlug } from '@/lib/utils';

interface DAppCardProps {
  dapp: DApp;
}

const statusColors: Record<DAppStatus, string> = {
  Mainnet: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
  Testnet: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
  Concept: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700',
  Prototype: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700',
  'U/C': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  Suspended: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
  Devnet: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700',
};

export function DAppCard({ dapp }: DAppCardProps) {
  const category = getCategoryById(dapp.category);
  const slug = dapp.slug || generateDAppSlug(dapp.name);

  return (
    <Link
      href={`/dapps/${slug}`}
      className="block w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
    >
      <div className="flex items-start gap-4">
        {dapp.image ? (
          <div className="flex-shrink-0 relative w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <Image
              src={dapp.image}
              alt={dapp.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <span className="text-2xl">{category?.emoji || '⚡'}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {dapp.name}
              </h3>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                ID: {dapp.id}
              </span>
            </div>
            <span
              className={`
                px-2 py-1 text-xs font-medium rounded border
                flex-shrink-0
                ${statusColors[dapp.status] || statusColors.Concept}
              `}
            >
              {dapp.status}
            </span>
          </div>

          {category && (
            <div className="flex items-center gap-1 mb-2">
              <span>{category.emoji}</span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {category.name}
              </span>
            </div>
          )}

          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
            {dapp.utility}
          </p>
        </div>
      </div>
    </Link>
  );
}


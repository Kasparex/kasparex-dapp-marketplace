import { DApp, type DAppStatus } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';

const statusColors: Record<DAppStatus, string> = {
  Mainnet: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
  Testnet: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
  Concept: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700',
  Prototype: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700',
  'U/C': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  Suspended: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
  Devnet: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700',
};

interface DAppDetailProps {
  dapp: DApp;
  onBack: () => void;
}

export function DAppDetail({ dapp, onBack }: DAppDetailProps) {
  const category = getCategoryById(dapp.category);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to dApps
      </button>

      {/* Header */}
      <div className="flex items-start gap-6">
        {dapp.image ? (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <img
              src={dapp.image}
              alt={dapp.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <span className="text-4xl">{category?.emoji || '⚡'}</span>
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {dapp.name}
            </h1>
            <span
              className={`
                px-3 py-1 text-sm font-medium rounded border
                ${statusColors[dapp.status] || statusColors.Concept}
              `}
            >
              {dapp.status}
            </span>
          </div>

          {category && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">{category.emoji}</span>
              <span className="text-zinc-600 dark:text-zinc-400">
                {category.name}
              </span>
            </div>
          )}

          {dapp.version && (
            <div className="text-sm text-zinc-500 dark:text-zinc-500 mb-4">
              {dapp.version} • {dapp.provider} • {dapp.network}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {dapp.description && (
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Description
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">{dapp.description}</p>
        </div>
      )}

      {/* Utility */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          ✅ Utility
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">{dapp.utility}</p>
      </div>

      {/* Process */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          ⚙️ Process
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">{dapp.process}</p>
      </div>

      {/* Benefits */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          🧠 Benefits
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">{dapp.benefits}</p>
      </div>

      {/* Developer & Network Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Developer
          </h3>
          <p className="text-zinc-900 dark:text-zinc-100">{dapp.developer}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Network
          </h3>
          <p className="text-zinc-900 dark:text-zinc-100">{dapp.network}</p>
        </div>
      </div>

      {/* Launch Button */}
      {dapp.url && (
        <div className="pt-4">
          <a
            href={dapp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Launch App
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}


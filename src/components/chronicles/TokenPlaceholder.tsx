import type { TokenLaunchStatus } from '@/lib/chronicles/types';

const statusLabel: Record<TokenLaunchStatus, string> = {
  'not-launched': 'Not launched',
  coming: 'Coming',
  live: 'Live',
};

export function TokenPlaceholder({
  status,
  contractAddress,
  utility,
}: {
  status: TokenLaunchStatus;
  contractAddress?: string;
  utility?: string;
}) {
  return (
    <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/5 dark:bg-cyan-500/10 p-5 mt-8">
      <p className="text-xs font-black uppercase tracking-widest text-[#02abb8] mb-3">Token integration (future)</p>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500 dark:text-zinc-400">Token status</dt>
          <dd className="font-bold text-zinc-900 dark:text-zinc-100">{statusLabel[status]}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-zinc-500 dark:text-zinc-400">Contract address</dt>
          <dd className="font-mono text-xs text-zinc-700 dark:text-zinc-300 break-all">
            {contractAddress || '— (placeholder)'}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-zinc-500 dark:text-zinc-400">Utility</dt>
          <dd className="text-zinc-700 dark:text-zinc-300">{utility || '—'}</dd>
        </div>
      </dl>
    </div>
  );
}

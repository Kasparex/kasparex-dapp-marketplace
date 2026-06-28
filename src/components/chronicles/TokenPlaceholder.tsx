import type { TokenLaunchStatus } from '@/lib/chronicles/types';
import { CHRONICLES_PANEL, CHRONICLES_PANEL_LABEL } from '@/lib/chronicles/typography';

const statusLabel: Record<TokenLaunchStatus, string> = {
  'not-launched': 'Not launched',
  coming: 'Coming',
  live: 'Live',
};

export function TokenPlaceholder({
  status,
  contractAddress,
  utility,
  className = '',
}: {
  status: TokenLaunchStatus;
  contractAddress?: string;
  utility?: string;
  className?: string;
}) {
  return (
    <div className={`${CHRONICLES_PANEL} p-4 mt-8 ${className}`.trim()}>
      <p className={`${CHRONICLES_PANEL_LABEL} mb-3`}>Token integration (future)</p>
      <dl className="space-y-3 text-base leading-relaxed">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-600 dark:text-white/70">Token status</dt>
          <dd className="font-bold text-zinc-900 dark:text-white">{statusLabel[status]}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-zinc-600 dark:text-white/70">Contract address</dt>
          <dd className="font-mono text-sm text-zinc-800 dark:text-white break-all">
            {contractAddress || 'TBD (placeholder)'}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-zinc-600 dark:text-white/70">Utility</dt>
          <dd className="text-zinc-800 dark:text-white">{utility || 'TBD'}</dd>
        </div>
      </dl>
    </div>
  );
}

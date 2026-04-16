'use client';

import { Tooltip } from '@/components/ui/Tooltip';

export type WalletQuickAction = {
  id: string;
  label: string;
  tooltip?: string;
  onClick: () => void;
  icon: 'send' | 'receive' | 'bridge' | 'buy';
  variant?: 'primary' | 'secondary';
  className?: string;
};

function ActionIcon({ icon }: { icon: WalletQuickAction['icon'] }) {
  const common = 'w-4 h-4';
  switch (icon) {
    case 'send':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      );
    case 'receive':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16m-7-7l7 7-7 7" />
        </svg>
      );
    case 'bridge':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    case 'buy':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7l1 2m0 0l2 10a2 2 0 002 2h8a2 2 0 002-2l2-10m-14 0h14M9 21a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" />
        </svg>
      );
  }
}

export function WalletQuickActionsRow({
  actions,
}: {
  actions: WalletQuickAction[];
}) {
  if (!actions.length) return null;

  return (
    <div className="px-4 py-3">
      <div className="grid grid-cols-2 gap-2">
        {actions.slice(0, 4).map((a) => {
          const isPrimary = a.variant === 'primary';
          return (
            <Tooltip key={a.id} content={a.tooltip || a.label}>
              <button
                type="button"
                onClick={a.onClick}
                className={[
                  'px-3 py-2 rounded-xl transition-colors text-sm font-semibold flex items-center justify-center gap-2',
                  isPrimary
                    ? 'bg-[#02abb8] hover:bg-[#028a94] text-white'
                    : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100',
                  a.className || '',
                ].join(' ')}
                aria-label={a.label}
              >
                <ActionIcon icon={a.icon} />
                {a.label}
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}


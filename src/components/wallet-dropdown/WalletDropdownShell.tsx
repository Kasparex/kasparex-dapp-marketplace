'use client';

import type { ReactNode } from 'react';

export function WalletDropdownShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl',
        'rounded-xl overflow-hidden',
        'w-[92vw] max-w-[420px] sm:w-[380px]',
        'max-h-[80vh] overflow-y-auto',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}


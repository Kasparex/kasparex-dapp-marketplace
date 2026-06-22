'use client';

import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip';

export const crowdkasInputClass =
  'w-full px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60';

export const crowdkasSmallInputClass =
  'w-full px-2.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40';

export const crowdkasPanelClass =
  'space-y-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800';

export const crowdkasCardClass =
  'rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4';

export const crowdkasPrimaryBtnClass =
  'w-full py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const crowdkasSecondaryBtnClass =
  'w-full py-2.5 rounded-lg border border-emerald-600 text-emerald-700 dark:text-emerald-300 font-medium hover:bg-emerald-500/10 transition-colors disabled:opacity-50';

export function CrowdKasShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="space-y-5">{children}</div>
    </TooltipProvider>
  );
}

export function CrowdKasFieldLabel({
  label,
  tooltip,
  htmlFor,
}: {
  label: string;
  tooltip?: string;
  htmlFor?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      {tooltip ? (
        <Tooltip content={tooltip}>
          <button
            type="button"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-400 dark:border-zinc-600 text-[10px] text-zinc-500 dark:text-zinc-400 hover:border-emerald-500 hover:text-emerald-600"
            aria-label={`Help: ${label}`}
          >
            ?
          </button>
        </Tooltip>
      ) : null}
    </div>
  );
}

export function CrowdKasError({ message }: { message: string }) {
  return (
    <div className="p-3 text-sm bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 rounded-lg">
      {message}
    </div>
  );
}

export function CrowdKasPrototypeNotice() {
  return (
    <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 leading-relaxed">
      L1 covenant simulator: campaign data is stored in this browser until Kaspa covenant wallets go live. Share this
      page URL only on the same device where the campaign was created.
    </p>
  );
}

export function CrowdKasTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-700 pb-3">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            active === t.id
              ? 'bg-emerald-600 text-white'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

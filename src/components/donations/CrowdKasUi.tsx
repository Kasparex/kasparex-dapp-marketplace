'use client';

import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip';
import { KX_PANEL, KX_PANEL_PADDING, KX_SURFACE_NESTED } from '@/lib/hub/shellTokens';

export const crowdkasInputClass =
  'w-full px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60';

export const crowdkasSmallInputClass =
  'w-full px-2.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40';

export const crowdkasPanelClass = `space-y-5 ${KX_SURFACE_NESTED} p-5`;

/** Hub panel token + padding (same as Store / dApps aside cards). */
export const crowdkasCardClass = `${KX_PANEL} ${KX_PANEL_PADDING}`;

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

/** Label with hover tooltip on the text itself (no ? icon). */
export function CrowdKasFieldLabel({
  label,
  tooltip,
  htmlFor,
}: {
  label: string;
  tooltip?: string;
  htmlFor?: string;
}) {
  const labelEl = (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium text-zinc-700 dark:text-zinc-300 ${tooltip ? 'cursor-help border-b border-dotted border-zinc-400/70 dark:border-zinc-500' : ''}`}
    >
      {label}
    </label>
  );
  return (
    <div className="mb-2">
      {tooltip ? <Tooltip content={tooltip}>{labelEl}</Tooltip> : labelEl}
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

/** @deprecated Removed from public UI; kept as no-op for any leftover imports. */
export function CrowdKasPrototypeNotice() {
  return null;
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

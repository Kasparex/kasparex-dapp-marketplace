'use client';

import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip';
import { covenantRuntimeBadge } from '@/lib/programmability/runtime-label';
import type { CovenantRuntimeMode } from '@/lib/covenant/types';

export const covenantInputClass =
  'w-full px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#02abb8]/40 focus:border-[#02abb8]/60';

export const covenantSmallInputClass =
  'w-full px-2.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#02abb8]/40';

export const covenantPanelClass =
  'space-y-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800';

export const covenantCardClass =
  'rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-3 text-sm text-zinc-700 dark:text-zinc-300';

export const covenantPrimaryBtnClass =
  'w-full py-2.5 rounded-lg bg-[#02abb8] text-white font-medium hover:bg-[#028a94] transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const covenantSecondaryBtnClass =
  'w-full py-2.5 rounded-lg border border-[#02abb8] text-[#02abb8] font-medium hover:bg-[#02abb8]/10 transition-colors disabled:opacity-50';

export function CovenantWidgetShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="px-6 py-6 space-y-6 max-w-2xl mx-auto">{children}</div>
    </TooltipProvider>
  );
}

export function CovenantHeader({
  title,
  subtitle,
  runtimeMode,
  effectiveMode,
}: {
  title: string;
  subtitle: string;
  runtimeMode?: CovenantRuntimeMode | string;
  effectiveMode?: CovenantRuntimeMode | string;
}) {
  const badge = covenantRuntimeBadge(
    (effectiveMode ?? runtimeMode ?? 'simulator') as CovenantRuntimeMode
  );

  return (
    <header className="text-center space-y-2">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
      <p className="kx-body max-w-lg mx-auto">{subtitle}</p>
      <CovenantRuntimeBadge
        label={badge.label}
        tone={badge.tone}
        description={badge.description}
        configuredMode={runtimeMode}
      />
    </header>
  );
}

export function CovenantRuntimeBadge({
  label,
  tone,
  description,
  configuredMode,
}: {
  label: string;
  tone: 'simulator' | 'l1' | 'hybrid';
  description: string;
  configuredMode?: CovenantRuntimeMode | string;
}) {
  const toneClass =
    tone === 'l1'
      ? 'text-emerald-700 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
      : tone === 'hybrid'
        ? 'text-amber-700 dark:text-amber-400 border-amber-500/40 bg-amber-500/10'
        : 'text-amber-700 dark:text-amber-400 border-amber-500/40 bg-amber-500/10';

  return (
    <div className={`inline-flex flex-col items-center gap-1 px-3 py-2 rounded-lg border text-xs ${toneClass}`}>
      <span className="font-semibold uppercase tracking-wide">{label}</span>
      <span>{description}</span>
      {configuredMode && configuredMode !== label.toLowerCase().replace(' ', '') ? (
        <span className="opacity-80">Configured: {configuredMode}</span>
      ) : null}
    </div>
  );
}

export function CovenantTabs<T extends string>({
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
              ? 'bg-[#02abb8] text-white'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function CovenantFieldLabel({
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
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      {tooltip ? (
        <Tooltip content={tooltip}>
          <button
            type="button"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-400 dark:border-zinc-600 text-[10px] text-zinc-500 dark:text-zinc-400 hover:border-[#02abb8] hover:text-[#02abb8]"
            aria-label={`Help: ${label}`}
          >
            ?
          </button>
        </Tooltip>
      ) : null}
    </div>
  );
}

export function CovenantError({ message }: { message: string }) {
  return (
    <div className="p-3 text-sm bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 rounded-lg">
      {message}
    </div>
  );
}

export function CovenantHowItWorks({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 kx-body text-zinc-700 dark:text-zinc-300">
      {children}
    </div>
  );
}

export function shortKaspaAddr(addr: string): string {
  const x = addr.replace(/^kaspa:/i, '');
  return x.length > 14 ? `${x.slice(0, 8)}...${x.slice(-4)}` : x;
}

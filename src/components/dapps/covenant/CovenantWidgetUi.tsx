'use client';

import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip';
import { covenantRuntimeBadge } from '@/lib/programmability/runtime-label';
import type { CovenantRuntimeMode } from '@/lib/covenant/types';
import {
  KX_BTN_PRIMARY,
  KX_BTN_SECONDARY,
  KX_INPUT,
  KX_PANEL_PADDING,
  KX_SURFACE_INSET,
} from '@/lib/hub/shellTokens';

export const covenantInputClass = KX_INPUT;
export const covenantSmallInputClass = KX_INPUT;
export const covenantPanelClass = `${KX_SURFACE_INSET} ${KX_PANEL_PADDING} space-y-5`;
export const covenantCardClass = `${KX_SURFACE_INSET} p-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-300`;
export const covenantPrimaryBtnClass = KX_BTN_PRIMARY;
export const covenantSecondaryBtnClass = KX_BTN_SECONDARY;

export function CovenantWidgetShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="space-y-5 p-4 sm:p-5">{children}</div>
    </TooltipProvider>
  );
}

export function CovenantHeader({
  title,
  subtitle,
  runtimeMode,
  effectiveMode,
  compact = false,
}: {
  title: string;
  subtitle: string;
  runtimeMode?: CovenantRuntimeMode | string;
  effectiveMode?: CovenantRuntimeMode | string;
  compact?: boolean;
}) {
  const badge = covenantRuntimeBadge((effectiveMode ?? runtimeMode ?? 'simulator') as CovenantRuntimeMode);

  if (compact) {
    return (
      <CovenantRuntimeBadge
        label={badge.label}
        tone={badge.tone}
        description={badge.description}
        configuredMode={runtimeMode}
      />
    );
  }

  return (
    <header className="text-center space-y-2">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
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
    <Tooltip content={description}>
      <div className={`inline-flex flex-col items-center gap-1 px-3 py-2 rounded-lg border text-xs cursor-help ${toneClass}`}>
        <span className="font-semibold uppercase tracking-wide">{label}</span>
        {configuredMode && configuredMode !== label.toLowerCase().replace(' ', '') ? (
          <span className="opacity-80">Configured: {configuredMode}</span>
        ) : null}
      </div>
    </Tooltip>
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
      <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
  return <div className="space-y-4 kx-body text-zinc-700 dark:text-zinc-300">{children}</div>;
}

export function shortKaspaAddr(addr: string): string {
  const x = addr.replace(/^kaspa:/i, '');
  return x.length > 14 ? `${x.slice(0, 8)}...${x.slice(-4)}` : x;
}

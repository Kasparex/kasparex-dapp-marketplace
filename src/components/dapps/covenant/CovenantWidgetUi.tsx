'use client';

import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { covenantRuntimeBadge } from '@/lib/programmability/runtime-label';
import type { CovenantRuntimeMode } from '@/lib/covenant/types';
import {
  KX_BTN_PRIMARY,
  KX_BTN_SECONDARY,
} from '@/lib/hub/shellTokens';

export const covenantInputClass = 'k-input text-base';
export const covenantSmallInputClass = 'k-input text-sm';
export const covenantPanelClass = 'space-y-5';
export const covenantCardClass = 'rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 space-y-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300';
export const covenantPrimaryBtnClass = KX_BTN_PRIMARY;
export const covenantSecondaryBtnClass = KX_BTN_SECONDARY;

export function CovenantWidgetShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="w-full space-y-6">{children}</div>
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
    <header className="space-y-2">
      <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h2>
      <p className="kx-body">{subtitle}</p>
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
      <div className={`inline-flex flex-col items-start gap-1 px-3 py-2 rounded-lg border text-xs cursor-help ${toneClass}`}>
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
    <KxFormFieldLabel htmlFor={htmlFor} tooltip={tooltip}>
      {label}
    </KxFormFieldLabel>
  );
}

export function CovenantError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
      {message}
    </div>
  );
}

import { DAppWidgetShell } from '@/components/dapps/DAppWidgetShell';

export function CovenantTabPanel({
  title,
  heading,
  description,
  children,
}: {
  title: string;
  heading?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <DAppWidgetShell title={title} heading={heading ?? title} description={description}>
      {children}
    </DAppWidgetShell>
  );
}

export function CovenantHowItWorks({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 kx-body text-zinc-700 dark:text-zinc-300">{children}</div>;
}

export function shortKaspaAddr(addr: string): string {
  const x = addr.replace(/^kaspa:/i, '');
  return x.length > 14 ? `${x.slice(0, 8)}...${x.slice(-4)}` : x;
}

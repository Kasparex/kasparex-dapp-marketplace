'use client';

import Link from 'next/link';
import type { CovenantTemplate } from '@/lib/programmability/types';
import {
  DEFAULT_PROGRAMMABLE_NETWORK,
  KASCOV_BASE_URL,
  kaspaComCovenantExplorerBase,
} from '@/lib/programmable/config';
import { getKpxCovenantBrand } from '@/lib/covenant/kpxBranding';
import type { CovenantRuntimeMode } from '@/lib/covenant/types';
import {
  CovenantWidgetShell,
  CovenantRuntimeBadge,
  CovenantFieldLabel,
  covenantInputClass,
  covenantPanelClass,
  covenantSecondaryBtnClass,
} from '@/components/dapps/covenant/CovenantWidgetUi';
import { covenantRuntimeBadge } from '@/lib/programmability/runtime-label';

export function KpxCovenantDisconnected({ template }: { template: CovenantTemplate }) {
  const brand = getKpxCovenantBrand(template);
  return (
    <div className="px-6 py-10 max-w-lg mx-auto text-center space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#02abb8]">{brand.displayName}</p>
      <p className="text-zinc-500 dark:text-zinc-400">{brand.disconnectedMessage}</p>
    </div>
  );
}

export function KpxCovenantShell({
  template,
  subtitle,
  runtimeMode,
  effectiveMode,
  children,
}: {
  template: CovenantTemplate;
  subtitle?: string;
  runtimeMode?: CovenantRuntimeMode | string;
  effectiveMode?: CovenantRuntimeMode | string;
  children: React.ReactNode;
}) {
  const brand = getKpxCovenantBrand(template);
  const badge = covenantRuntimeBadge(
    (effectiveMode ?? runtimeMode ?? 'simulator') as CovenantRuntimeMode,
  );
  const explorerBase = kaspaComCovenantExplorerBase(DEFAULT_PROGRAMMABLE_NETWORK);

  return (
    <CovenantWidgetShell>
      <header className="text-center space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center rounded-md border border-[#02abb8]/40 bg-[#02abb8]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#02abb8]">
            KPX
          </span>
          <span className="inline-flex items-center rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 font-mono text-[10px] text-zinc-600 dark:text-zinc-400">
            {brand.payloadTemplate}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{brand.displayName}</h2>
        <p className="kx-body max-w-lg mx-auto">{subtitle ?? brand.tagline}</p>
        <CovenantRuntimeBadge
          label={badge.label}
          tone={badge.tone}
          description={badge.description}
          configuredMode={runtimeMode}
        />
      </header>

      {children}

      <footer className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
        <p>
          Kasparex covenant template. Deploys tag{' '}
          <span className="font-mono text-zinc-600 dark:text-zinc-300">{brand.payloadTemplate}</span> on
          chain for explorer recognition.
        </p>
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Link
            href={explorerBase}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#02abb8] hover:underline"
          >
            KaspaCom Explorer
          </Link>
          <span aria-hidden>·</span>
          <Link
            href={KASCOV_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#02abb8] hover:underline"
          >
            kascov
          </Link>
        </p>
      </footer>
    </CovenantWidgetShell>
  );
}

export function KpxCovenantImportPanel({
  id,
  value,
  onChange,
  onImport,
  busy,
  label = 'Import by covenant id',
  tooltip = 'Paste a 64-char covenant id from KaspaCom Explorer or kascov to track an on-chain instance in this browser.',
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onImport: () => void;
  busy?: boolean;
  label?: string;
  tooltip?: string;
}) {
  return (
    <div className={`${covenantPanelClass} space-y-2`}>
      <CovenantFieldLabel label={label} htmlFor={id} tooltip={tooltip} />
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.trim().toLowerCase())}
        placeholder="64-char hex covenant id"
        className={`${covenantInputClass} font-mono text-sm`}
        spellCheck={false}
      />
      <button
        type="button"
        disabled={busy || value.length < 64}
        onClick={onImport}
        className={covenantSecondaryBtnClass}
      >
        Import from indexer
      </button>
    </div>
  );
}

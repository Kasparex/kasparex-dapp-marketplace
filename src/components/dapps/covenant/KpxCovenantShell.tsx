'use client';

import type { CovenantTemplate } from '@/lib/programmability/types';
import { getKpxCovenantBrand } from '@/lib/covenant/kpxBranding';
import type { CovenantRuntimeMode } from '@/lib/covenant/types';
import {
  CovenantFieldLabel,
  CovenantWidgetShell,
  covenantInputClass,
  covenantSecondaryBtnClass,
} from '@/components/dapps/covenant/CovenantWidgetUi';

export function KpxCovenantDisconnected({ template }: { template: CovenantTemplate }) {
  const brand = getKpxCovenantBrand(template);
  return (
    <div className="py-6 text-center space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#02abb8]">{brand.displayName}</p>
      <p className="text-zinc-500 dark:text-zinc-400">{brand.disconnectedMessage}</p>
    </div>
  );
}

export function KpxCovenantShell({
  template: _template,
  children,
}: {
  template: CovenantTemplate;
  runtimeMode?: CovenantRuntimeMode | string;
  effectiveMode?: CovenantRuntimeMode | string;
  children: React.ReactNode;
}) {
  return (
    <CovenantWidgetShell>
      {children}

      <footer className="border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <p>
          On-chain references, covenant IDs, and explorer links live in the{' '}
          <span className="font-medium text-zinc-600 dark:text-zinc-300">Metadata</span> tab.
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
    <div className="space-y-3">
      <div className="k-form-group !mb-0">
        <CovenantFieldLabel label={label} htmlFor={id} tooltip={tooltip} />
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.trim().toLowerCase())}
          placeholder="64-char hex covenant id"
          className={`${covenantInputClass} font-mono`}
          spellCheck={false}
        />
      </div>
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

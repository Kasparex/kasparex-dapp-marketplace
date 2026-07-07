'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { CovenantTemplate } from '@/lib/programmability/types';
import {
  buildKpxCovenantExplorerLinkRows,
  buildKpxCovenantTemplateMetadataRows,
  type KpxCovenantMetadataInstance,
  type KpxCovenantMetadataRow,
} from '@/lib/covenant/kpxCovenantMetadata';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxDataTable, type KxDataTableRow } from '@/components/kx/KxDataTable';
import { KX_INPUT } from '@/lib/hub/shellTokens';

function toTableRows(rows: KpxCovenantMetadataRow[]): KxDataTableRow[] {
  return rows.map((row) => ({
    label: row.label,
    value: row.value,
    mono: row.mono,
    hint: row.hint,
    links: row.links,
  }));
}

function MetadataBlock({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <DAppSectionHeader title={title} hint={description} className="!mb-0" />
      {children}
    </section>
  );
}

export function KpxCovenantMetadataView({
  template,
  runtimeMode,
  effectiveMode,
  instances,
  emptyMessage = 'No covenant instances yet. Create one or import by covenant ID to populate on-chain references.',
}: {
  template: CovenantTemplate;
  runtimeMode?: string;
  effectiveMode?: string;
  instances: KpxCovenantMetadataInstance[];
  emptyMessage?: string;
}) {
  const [selectedId, setSelectedId] = useState(instances[0]?.id ?? '');

  useEffect(() => {
    if (!instances.some((i) => i.id === selectedId)) {
      setSelectedId(instances[0]?.id ?? '');
    }
  }, [instances, selectedId]);

  const selected = useMemo(
    () => instances.find((i) => i.id === selectedId) ?? instances[0],
    [instances, selectedId],
  );

  const templateRows = useMemo(
    () => buildKpxCovenantTemplateMetadataRows({ template, runtimeMode, effectiveMode }),
    [template, runtimeMode, effectiveMode],
  );

  const selectedCovenantId = selected?.rows.find((r) => r.label === 'Covenant ID')?.value;
  const explorerRows = useMemo(
    () => buildKpxCovenantExplorerLinkRows(selectedCovenantId),
    [selectedCovenantId],
  );

  return (
    <div className="space-y-6">
      <MetadataBlock
        title="Template and runtime"
        description="Standard KPX covenant identifiers and the active execution mode for this widget."
      >
        <KxDataTable rows={toTableRows(templateRows)} />
      </MetadataBlock>

      <MetadataBlock
        title="Explorers and indexers"
        description="Open the selected instance on KaspaCom, kascov, or the public Kaspa explorer."
      >
        <KxDataTable rows={toTableRows(explorerRows)} />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Covenant IDs must be 64-char hex to link indexers. Transaction hashes open on KaspaCom and{' '}
          <Link
            href="https://explorer.kaspa.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#02abb8] hover:underline"
          >
            explorer.kaspa.org
          </Link>
          .
        </p>
      </MetadataBlock>

      {instances.length === 0 ? (
        <MetadataBlock title="Covenant instances">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{emptyMessage}</p>
        </MetadataBlock>
      ) : (
        <MetadataBlock
          title="Covenant instance"
          description="Technical metadata for a lock, split, campaign, or voucher tracked in this browser."
        >
          {instances.length > 1 ? (
            <div>
              <label htmlFor="kpx-metadata-instance" className="k-label">
                Select instance
              </label>
              <select
                id="kpx-metadata-instance"
                value={selected?.id ?? ''}
                onChange={(e) => setSelectedId(e.target.value)}
                className={`${KX_INPUT} mt-1.5`}
              >
                {instances.map((instance) => (
                  <option key={instance.id} value={instance.id}>
                    {instance.title}
                    {instance.subtitle ? ` (${instance.subtitle})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {selected ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{selected.title}</p>
                {selected.subtitle ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{selected.subtitle}</p>
                ) : null}
              </div>
              <KxDataTable rows={toTableRows(selected.rows)} />
            </div>
          ) : null}
        </MetadataBlock>
      )}
    </div>
  );
}
